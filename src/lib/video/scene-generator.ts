import { runKlingJob, type KlingRequest } from './fal-client';
import { sceneToKlingPrompt } from '../ai/scene-prompts';
import type { SceneScript, GenreDefinition, CharacterData } from '../types';

export async function generateScene(
  scene: SceneScript,
  genre: GenreDefinition,
  characters: CharacterData[],
  baseUrl: string,
  onProgress?: (status: string) => void
): Promise<string> {
  const prompt = sceneToKlingPrompt(scene, genre, characters);

  // Build elements using the app's public URLs directly.
  // fal.ai fetches images from these URLs when submitting to Kling — no need
  // to re-upload to fal.ai storage. This also avoids filesystem read issues.
  const elements: Array<{ frontal_image_url: string; reference_image_urls?: string[] }> = [];

  for (const charName of scene.characters) {
    const charData = characters.find(c => c.name === charName);
    if (!charData) continue;

    const photos = charData.originalPhotos.length > 0
      ? charData.originalPhotos
      : charData.processedPhotos;

    if (photos.length === 0) continue;

    const frontalUrl = `${baseUrl}${photos[0]}`;
    const element: { frontal_image_url: string; reference_image_urls?: string[] } = {
      frontal_image_url: frontalUrl,
    };

    if (photos.length > 1) {
      element.reference_image_urls = photos.slice(1, 4).map(p => `${baseUrl}${p}`);
    }

    elements.push(element);
    console.log(`  Element for ${charName}: ${frontalUrl.substring(0, 80)}...`);
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
