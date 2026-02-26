import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import type { Scene } from '../db/schema';
import type { GenreDefinition, Script } from '../types';

// Use ffmpeg-static binary
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

function execFFmpeg(command: ffmpeg.FfmpegCommand): Promise<void> {
  return new Promise((resolve, reject) => {
    command
      .on('end', () => resolve())
      .on('error', (err: Error) => reject(err))
      .run();
  });
}

async function downloadVideo(url: string, destPath: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to download video: ${url}`);
  const buffer = await response.arrayBuffer();
  fs.writeFileSync(destPath, Buffer.from(buffer));
}

export async function assembleTrailer(
  projectId: string,
  scenes: Scene[],
  genre: GenreDefinition,
  script: Script
): Promise<string> {
  const outputDir = path.join(process.cwd(), 'storage', 'output', projectId);
  const scenesDir = path.join(process.cwd(), 'storage', 'scenes', projectId);

  fs.mkdirSync(outputDir, { recursive: true });
  fs.mkdirSync(scenesDir, { recursive: true });

  // Sort scenes by order
  const sortedScenes = [...scenes].sort((a, b) => a.orderIndex - b.orderIndex);

  // Download all scene videos
  console.log('Downloading scene videos...');
  const localPaths: string[] = [];
  for (const scene of sortedScenes) {
    if (!scene.videoUrl) throw new Error(`Scene ${scene.id} has no video URL`);

    const localPath = path.join(scenesDir, `scene_${scene.orderIndex}.mp4`);
    await downloadVideo(scene.videoUrl, localPath);
    localPaths.push(localPath);
  }

  // Create concat file
  const concatFile = path.join(outputDir, 'concat.txt');
  const concatContent = localPaths.map(p => `file '${p.replace(/\\/g, '/')}'`).join('\n');
  fs.writeFileSync(concatFile, concatContent);

  // Step 1: Concatenate all scenes
  const tempConcat = path.join(outputDir, 'temp_concat.mp4');
  await execFFmpeg(
    ffmpeg()
      .input(concatFile)
      .inputOptions(['-f', 'concat', '-safe', '0'])
      .outputOptions(['-c', 'copy'])
      .output(tempConcat)
  );

  // Step 2: Check if music track exists
  const musicTrackPath = path.join(process.cwd(), 'public', genre.musicTrack);
  const hasMusicTrack = fs.existsSync(musicTrackPath);

  let tempWithMusic = tempConcat;

  if (hasMusicTrack) {
    tempWithMusic = path.join(outputDir, 'temp_with_music.mp4');
    await execFFmpeg(
      ffmpeg()
        .input(tempConcat)
        .input(musicTrackPath)
        .complexFilter([
          '[1:a]volume=0.25[music]',
          '[0:a][music]amix=inputs=2:duration=shortest[aout]'
        ])
        .outputOptions(['-map', '0:v', '-map', '[aout]', '-c:v', 'copy', '-shortest'])
        .output(tempWithMusic)
    );
  }

  // Resolve resolution from genre aspect ratio
  const resolutionMap: Record<string, [number, number]> = {
    '16:9': [1920, 1080],
    '9:16': [1080, 1920],
    '1:1':  [1080, 1080],
  };
  const [cardW, cardH] = resolutionMap[genre.aspectRatio] || [1920, 1080];

  // Generate title/closing card images using sharp+SVG — avoids drawtext
  // (requires libfreetype) and lavfi (not compiled into ffmpeg-static).
  async function makeCardImage(text: string, color: string, destPath: string) {
    const fontSize = Math.round(cardW * 0.04);
    const svg = `<svg width="${cardW}" height="${cardH}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="black"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
        font-family="sans-serif" font-weight="bold" font-size="${fontSize}"
        fill="${color}">${text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</text>
    </svg>`;
    await sharp(Buffer.from(svg)).jpeg({ quality: 95 }).toFile(destPath);
  }

  const titleJpgPath = path.join(outputDir, 'title_card.jpg');
  const closingJpgPath = path.join(outputDir, 'closing_card.jpg');

  await makeCardImage(genre.titleCard.text, 'red', titleJpgPath);
  await makeCardImage(script.closingCard?.text || 'FIN', 'white', closingJpgPath);

  // Convert each card image to a 3-second silent video (no drawtext filter needed)
  const titleCardPath = path.join(outputDir, 'title_card.mp4');
  await execFFmpeg(
    ffmpeg()
      .input(titleJpgPath)
      .inputOptions(['-loop', '1', '-framerate', '25'])
      .outputOptions(['-t', '3', '-an', '-c:v', 'libx264', '-pix_fmt', 'yuv420p'])
      .output(titleCardPath)
  );

  const closingCardPath = path.join(outputDir, 'closing_card.mp4');
  await execFFmpeg(
    ffmpeg()
      .input(closingJpgPath)
      .inputOptions(['-loop', '1', '-framerate', '25'])
      .outputOptions(['-t', '3', '-an', '-c:v', 'libx264', '-pix_fmt', 'yuv420p'])
      .output(closingCardPath)
  );

  // Step 5: Final concat with title + main + closing
  const finalConcatFile = path.join(outputDir, 'final_concat.txt');
  fs.writeFileSync(finalConcatFile, [
    `file '${titleCardPath.replace(/\\/g, '/')}'`,
    `file '${tempWithMusic.replace(/\\/g, '/')}'`,
    `file '${closingCardPath.replace(/\\/g, '/')}'`,
  ].join('\n'));

  const finalOutput = path.join(outputDir, 'trailer.mp4');
  await execFFmpeg(
    ffmpeg()
      .input(finalConcatFile)
      .inputOptions(['-f', 'concat', '-safe', '0'])
      .outputOptions(['-c:v', 'libx264', '-c:a', 'aac', '-movflags', '+faststart'])
      .output(finalOutput)
  );

  // Cleanup temp files
  try {
    [tempConcat, titleCardPath, closingCardPath, titleJpgPath, closingJpgPath, concatFile, finalConcatFile].forEach(f => {
      if (fs.existsSync(f) && f !== tempWithMusic) fs.unlinkSync(f);
    });
    if (tempWithMusic !== tempConcat && fs.existsSync(tempWithMusic)) {
      fs.unlinkSync(tempWithMusic);
    }
  } catch {
    // Ignore cleanup errors
  }

  return `/api/files/output/${projectId}/trailer.mp4`;
}
