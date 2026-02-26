import Anthropic from '@anthropic-ai/sdk';
import type { GenreDefinition, CharacterData, Script } from '../types';
import { buildSystemPrompt, buildUserPrompt } from './prompt-templates';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function generateScript(
  genre: GenreDefinition,
  characters: CharacterData[],
  customPrompt?: string,
): Promise<Script> {
  const systemPrompt = buildSystemPrompt(genre);
  const userPrompt = buildUserPrompt(characters, genre, customPrompt);

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: userPrompt,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }

  // Clean up the response - remove markdown code blocks if present
  let jsonText = content.text.trim();
  if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  }

  const script = JSON.parse(jsonText) as Script;

  // Validate the script
  if (!script.title || !script.scenes || !Array.isArray(script.scenes)) {
    throw new Error('Invalid script structure from Claude');
  }

  // Enforce scene count and valid durations
  script.scenes = script.scenes
    .slice(0, genre.sceneCount)
    .map(scene => ({
      ...scene,
      duration: scene.duration >= 8 ? 10 : 5,
    }));

  return script;
}
