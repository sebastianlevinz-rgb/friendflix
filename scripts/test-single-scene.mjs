/**
 * Test a single scene generation to diagnose the 422 error
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as fal from '@fal-ai/serverless-client';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// Load env
const env = Object.fromEntries(
  readFileSync(join(ROOT, '.env.local'), 'utf8')
    .split('\n').filter(l => l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);
fal.config({ credentials: env.FAL_KEY });

const KLING_MODEL = 'fal-ai/kling-video/v3/standard/text-to-video';

async function run() {
  console.log('\n🧪 Testing Kling v3 with a simple prompt (no elements)...\n');

  try {
    const result = await fal.subscribe(KLING_MODEL, {
      input: {
        prompt: 'Two secret agents running through the streets of Buenos Aires at night, cinematic action shot, 4K',
        duration: '5',
        aspect_ratio: '16:9',
        negative_prompt: 'blurry, low quality',
        cfg_scale: 0.5,
        generate_audio: false,
      },
      pollInterval: 5000,
      onQueueUpdate: (update) => {
        process.stdout.write(`\r  Status: ${update.status}           `);
      },
    });

    console.log('\n\n✅ Result:', JSON.stringify(result, null, 2).substring(0, 500));
  } catch (err) {
    console.error('\n\n❌ Error:', err.message);
    if (err.body) {
      console.error('   Body:', JSON.stringify(err.body, null, 2));
    }
    if (err.status) {
      console.error('   Status:', err.status);
    }
  }
}

run();
