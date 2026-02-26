/**
 * Test Kling v3 with elements to diagnose the 422 error
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as fal from '@fal-ai/serverless-client';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const env = Object.fromEntries(
  readFileSync(join(ROOT, '.env.local'), 'utf8')
    .split('\n').filter(l => l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);
fal.config({ credentials: env.FAL_KEY });

const KLING_MODEL = 'fal-ai/kling-video/v3/standard/text-to-video';

// Upload a test image first
async function uploadTestImage(url) {
  console.log(`  Downloading ${url}...`);
  const res = await fetch(url);
  const buf = await res.arrayBuffer();
  const blob = new Blob([buf], { type: 'image/jpeg' });
  const file = new File([blob], 'test.jpg', { type: 'image/jpeg' });
  console.log(`  Uploading to fal.ai storage...`);
  const falUrl = await fal.storage.upload(file);
  console.log(`  → ${falUrl.substring(0, 70)}...`);
  return falUrl;
}

async function run() {
  console.log('\n🧪 Testing Kling v3 WITH elements...\n');

  // Use a fresh pravatar image
  const photoUrl = await uploadTestImage('https://i.pravatar.cc/400?img=3');

  console.log('\n  Submitting with elements...');
  try {
    const result = await fal.subscribe(KLING_MODEL, {
      input: {
        prompt: 'A man running through the streets of Buenos Aires at night, cinematic action shot, 4K',
        duration: '5',
        aspect_ratio: '16:9',
        negative_prompt: 'blurry, low quality',
        cfg_scale: 0.5,
        generate_audio: false,
        elements: [{ frontal_image_url: photoUrl }],
      },
      pollInterval: 5000,
      onQueueUpdate: (update) => {
        process.stdout.write(`\r  Status: ${update.status}           `);
      },
    });

    console.log('\n\n✅ Result:', JSON.stringify(result, null, 2).substring(0, 500));
  } catch (err) {
    console.error('\n\n❌ Error type:', err.constructor.name);
    console.error('   Message:', err.message);
    if (err.body) console.error('   Body:', JSON.stringify(err.body, null, 2));
    if (err.status) console.error('   HTTP status:', err.status);
  }
}

run();
