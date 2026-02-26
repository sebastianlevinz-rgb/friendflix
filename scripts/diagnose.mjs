/**
 * Diagnostic script: checks the fal.ai status of all scenes in the latest project
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import * as fal from '@fal-ai/serverless-client';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// Load env
const envPath = join(ROOT, '.env.local');
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter(l => l.includes('='))
    .map(l => {
      const idx = l.indexOf('=');
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
    })
);

const FAL_KEY = env.FAL_KEY;
if (!FAL_KEY) {
  console.error('FAL_KEY not found in .env.local');
  process.exit(1);
}

fal.config({ credentials: FAL_KEY });

const KLING_MODEL = 'fal-ai/kling-video/v3/standard/text-to-video';

const db = new Database(join(ROOT, 'storage', 'friendflix.db'), { readonly: true });

// Get latest project
const project = db.prepare(`SELECT * FROM projects ORDER BY created_at DESC LIMIT 1`).get();
if (!project) {
  console.log('No projects found in DB');
  process.exit(0);
}

console.log(`\n📋 Latest project: ${project.id}`);
console.log(`   Status: ${project.status}`);
console.log(`   Genre: ${project.genre}`);
if (project.script_json) {
  const s = JSON.parse(project.script_json);
  console.log(`   Title: "${s.title}"`);
}
console.log();

const scenes = db.prepare(`SELECT * FROM scenes WHERE project_id = ? ORDER BY order_index`).all(project.id);
console.log(`🎬 Scenes (${scenes.length} total):\n`);

for (const scene of scenes) {
  console.log(`  Scene ${scene.order_index + 1} [${scene.id.slice(0, 8)}]`);
  console.log(`    DB status: ${scene.status}`);
  console.log(`    fal_request_id: ${scene.fal_request_id || '(none)'}`);

  if (scene.fal_request_id && scene.status !== 'complete') {
    try {
      process.stdout.write(`    Checking fal.ai... `);
      const status = await fal.queue.status(KLING_MODEL, {
        requestId: scene.fal_request_id,
        logs: false,
      });
      console.log(`→ ${status.status}`);

      if (status.status === 'COMPLETED') {
        console.log(`    ✅ COMPLETED on fal.ai but not in DB — polling bug!`);
        // Fetch result to see video URL
        try {
          const result = await fal.queue.result(KLING_MODEL, { requestId: scene.fal_request_id });
          const videoUrl = result?.video?.url || result?.videos?.[0]?.url || '(unknown)';
          console.log(`    Video URL: ${videoUrl.substring(0, 80)}...`);
        } catch (e) {
          console.log(`    Could not fetch result: ${e.message}`);
        }
      }
    } catch (e) {
      console.log(`→ ERROR: ${e.message}`);
    }
  } else if (scene.status === 'complete') {
    console.log(`    ✅ Complete (video: ${scene.video_url?.substring(0, 60)}...)`);
  }
  console.log();
}

db.close();
