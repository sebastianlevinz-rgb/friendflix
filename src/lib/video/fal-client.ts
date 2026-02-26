import * as fal from '@fal-ai/serverless-client';

fal.config({ credentials: process.env.FAL_KEY! });

export const KLING_MODEL = 'fal-ai/kling-video/v3/standard/text-to-video';

export interface KlingRequest {
  prompt: string;
  duration: '5' | '10';
  aspect_ratio: '16:9' | '9:16' | '1:1';
  negative_prompt?: string;
  cfg_scale?: number;
  generate_audio?: boolean;
  elements?: Array<{
    frontal_image_url: string;
    reference_image_urls?: string[];
  }>;
}

export interface KlingResult {
  video: { url: string };
}

/**
 * Submit a Kling job and wait for it to complete.
 * Uses fal.subscribe() which handles queue polling internally.
 * onProgress is called with status updates during processing.
 */
export async function runKlingJob(
  request: KlingRequest,
  onProgress?: (status: string) => void
): Promise<KlingResult> {
  const result = await fal.subscribe(KLING_MODEL, {
    input: request,
    pollInterval: 8000, // check every 8 seconds
    onQueueUpdate: (update) => {
      onProgress?.(update.status);
    },
  }) as { video?: { url: string }; videos?: Array<{ url: string }> };

  const videoUrl = result.video?.url || result.videos?.[0]?.url;
  if (!videoUrl) {
    throw new Error('No video URL in Kling result: ' + JSON.stringify(result));
  }

  return { video: { url: videoUrl } };
}
