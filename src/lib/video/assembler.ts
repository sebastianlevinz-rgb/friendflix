import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
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

  // Step 3: Add title card at the beginning (3 seconds)
  const titleCardPath = path.join(outputDir, 'title_card.mp4');
  const titleText = genre.titleCard.text.replace(/'/g, "\\'").replace(/:/g, '\\:');

  await execFFmpeg(
    ffmpeg()
      .input('color=black:s=1920x1080:d=3')
      .inputOptions(['-f', 'lavfi'])
      .videoFilter(
        `drawtext=text='${titleText}':fontcolor=red:fontsize=72:x=(w-text_w)/2:y=(h-text_h)/2:font=Impact`
      )
      .outputOptions(['-t', '3', '-an'])
      .output(titleCardPath)
  );

  // Step 4: Add closing card (3 seconds)
  const closingCardPath = path.join(outputDir, 'closing_card.mp4');
  const closingText = (script.closingCard?.text || 'FIN').replace(/'/g, "\\'").replace(/:/g, '\\:');

  await execFFmpeg(
    ffmpeg()
      .input('color=black:s=1920x1080:d=3')
      .inputOptions(['-f', 'lavfi'])
      .videoFilter(
        `drawtext=text='${closingText}':fontcolor=white:fontsize=64:x=(w-text_w)/2:y=(h-text_h)/2:font=Impact`
      )
      .outputOptions(['-t', '3', '-an'])
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
    [tempConcat, titleCardPath, closingCardPath, concatFile, finalConcatFile].forEach(f => {
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
