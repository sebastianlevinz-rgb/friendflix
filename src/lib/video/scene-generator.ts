import { runKlingJob, type KlingRequest } from './fal-client';
import { sceneToKlingPrompt } from '../ai/scene-prompts';
import type { SceneScript, GenreDefinition, CharacterData } from '../types';
import * as fal from '@fal-ai/serverless-client';
import fs from 'fs';
import path from 'path';

fal.config({ credentials: process.env.FAL_KEY! });

// Cache uploaded URLs to avoid re-uploading the same photo multiple times
const uploadCache = new Map<string, string>();

async function uploadImageToFal(apiPath: string): Promise<string> {
  if (uploadCache.has(apiPath)) {
    return uploadCache.get(apiPath)!;
  }

  // Convert API path (/api/files/...) to filesystem path
  const relativePath = apiPath.replace('/api/files/', '');
  const fullPath = path.join(process.cwd(), 'storage', relativePath);

  if (!fs.existsSync(fullPath)) {
    throw new Error(`Image file not found: ${fullPath}`);
  }

  const buffer = fs.readFileSync(fullPath);
  const ext = path.extname(fullPath).toLowerCase();
  const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';

  const blob = new Blob([buffer], { type: mimeType });
  const file = new File([blob], path.basename(fullPath), { type: mimeType });

  console.log(`  Uploading ${path.basename(fullPath)} to fal.ai storage...`);
  const url = await fal.storage.upload(file);
  uploadCache.set(apiPath, url);
  console.log(`  Uploaded → ${url.substring(0, 60)}...`);

  return url;
}

export async function generateScene(
  scene: SceneScript,
  genre: GenreDefinition,
  characters: CharacterData[],
  _baseUrl: string,
  onProgress?: (status: string) => void
): Promise<string> {
  const prompt = sceneToKlingPrompt(scene, genre, characters);

  // Build elements with fal.ai CDN URLs (correct format for Kling)
  const elements: Array<{ frontal_image_url: string; reference_image_urls?: string[] }> = [];

  for (const charName of scene.characters) {
    const charData = characters.find(c => c.name === charName);
    if (!charData) continue;

    // Always use original photos for Kling elements — transparent PNGs from
    // background removal cause 422 errors on result fetch in Kling v3.
    const photos = charData.originalPhotos.length > 0
      ? charData.originalPhotos
      : charData.processedPhotos;

    if (photos.length === 0) continue;

    try {
      const frontalUrl = await uploadImageToFal(photos[0]);
      const element: { frontal_image_url: string; reference_image_urls?: string[] } = {
        frontal_image_url: frontalUrl,
      };

      if (photos.length > 1) {
        const refUrls: string[] = [];
        for (const refPhoto of photos.slice(1, 4)) {
          refUrls.push(await uploadImageToFal(refPhoto));
        }
        element.reference_image_urls = refUrls;
      }

      elements.push(element);
    } catch (err) {
      console.warn(`Warning: Could not upload photo for ${charName}:`, err);
    }
  }

  const duration: '5' | '10' = scene.duration >= 8 ? '10' : '5';

  const request: KlingRequest = {
    prompt,
    duration,
    aspect_ratio: genre.aspectRatio,
    negative_prompt: 'blurry, low quality, text, watermark, logo, distorted faces, artifacts',
    cfg_scale: 0.5,
    generate_audio: !!scene.dialogue,
    elements: elements.length > 0 ? elements : undefined,
  };

  console.log(`  Submitting scene ${scene.sceneNumber} to Kling (${duration}s, ${elements.length} elements)...`);
  const result = await runKlingJob(request, onProgress);
  console.log(`  Scene ${scene.sceneNumber} complete: ${result.video.url.substring(0, 60)}...`);
  return result.video.url;
}
