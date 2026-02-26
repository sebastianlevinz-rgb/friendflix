import * as fal from '@fal-ai/serverless-client';
import fs from 'fs';
import path from 'path';

fal.config({
  credentials: process.env.FAL_KEY!,
});

export async function removeBackground(
  imagePath: string,
  outputDir: string
): Promise<string> {
  // Read the image and convert to base64 data URL
  const imageBuffer = fs.readFileSync(imagePath);
  const base64 = imageBuffer.toString('base64');
  const mimeType = imagePath.endsWith('.png') ? 'image/png' : 'image/jpeg';
  const dataUrl = `data:${mimeType};base64,${base64}`;

  try {
    const result = await fal.subscribe('fal-ai/imageutils/rembg', {
      input: {
        image_url: dataUrl,
      },
    }) as { image: { url: string } };

    // Download the processed image
    const processedUrl = result.image.url;
    const response = await fetch(processedUrl);
    const buffer = await response.arrayBuffer();

    const filename = path.basename(imagePath, path.extname(imagePath)) + '_nobg.png';
    const outputPath = path.join(outputDir, filename);

    fs.writeFileSync(outputPath, Buffer.from(buffer));

    // Return the relative path for storage
    return outputPath;
  } catch (error) {
    console.error('Background removal failed:', error);
    // Return original if removal fails
    return imagePath;
  }
}

export async function processCharacterPhotos(
  photos: string[],
  processedDir: string
): Promise<string[]> {
  const processedPaths: string[] = [];

  for (const photoPath of photos) {
    const processedPath = await removeBackground(photoPath, processedDir);
    processedPaths.push(processedPath);
  }

  return processedPaths;
}
