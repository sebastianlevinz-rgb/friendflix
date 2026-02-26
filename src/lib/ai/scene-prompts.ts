import type { SceneScript, GenreDefinition, CharacterData } from '../types';

export function sceneToKlingPrompt(
  scene: SceneScript,
  genre: GenreDefinition,
  characters: CharacterData[]
): string {
  const parts: string[] = [
    genre.visualStyle,
    scene.lighting,
    scene.visualDescription,
    scene.action,
  ];

  // Name the characters naturally — Kling applies likeness from elements array automatically
  if (scene.characters.length > 0) {
    parts.push(`Characters in scene: ${scene.characters.join(', ')}`);
  }

  // Add dialogue if present
  if (scene.dialogue) {
    parts.push(
      `${scene.dialogue.speaker} (${scene.dialogue.tone}, ${scene.dialogue.language}): "${scene.dialogue.text}"`
    );
  }

  // Atmosphere and camera
  parts.push(scene.atmosphere);
  parts.push(`Camera: ${scene.cameraMovement}`);

  return parts.filter(Boolean).join('. ');
}

export function buildKlingElements(
  scene: SceneScript,
  allCharacters: CharacterData[],
  baseUrl: string
): Array<{ image_url: string; ref_image_urls?: string[] }> {
  const elements: Array<{ image_url: string; ref_image_urls?: string[] }> = [];

  for (const charName of scene.characters) {
    const charData = allCharacters.find(c => c.name === charName);
    if (!charData) continue;

    const photos = charData.processedPhotos.length > 0
      ? charData.processedPhotos
      : charData.originalPhotos;

    if (photos.length === 0) continue;

    const element: { image_url: string; ref_image_urls?: string[] } = {
      image_url: `${baseUrl}${photos[0]}`,
    };

    if (photos.length > 1) {
      element.ref_image_urls = photos.slice(1, 4).map(p => `${baseUrl}${p}`);
    }

    elements.push(element);
  }

  return elements;
}
