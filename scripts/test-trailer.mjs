/**
 * Script de prueba: crea un trailer completo via API
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE_URL = 'http://localhost:3004';

async function downloadTestImage(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download: ${url} (${res.status})`);
  const buffer = await res.arrayBuffer();
  writeFileSync(destPath, Buffer.from(buffer));
  return destPath;
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  console.log('\n🎬 FriendFlix — Test de trailer\n');

  const testDir = join(__dirname, '..', 'storage', 'test-images');
  mkdirSync(testDir, { recursive: true });

  console.log('📸 Descargando imágenes de prueba (pravatar.cc)...');

  const characters = [
    { name: 'Pablo', url: 'https://i.pravatar.cc/400?img=3', file: join(testDir, 'pablo.jpg') },
    { name: 'Esteban', url: 'https://i.pravatar.cc/400?img=12', file: join(testDir, 'esteban.jpg') },
  ];

  for (const char of characters) {
    try {
      await downloadTestImage(char.url, char.file);
      console.log(`  ✅ ${char.name}: descargado (${Math.round(readFileSync(char.file).length / 1024)}KB)`);
    } catch (e) {
      console.error(`  ❌ Error descargando ${char.name}:`, e.message);
      process.exit(1);
    }
  }

  // Crear proyecto
  console.log('\n📋 Creando proyecto (genre: action_thriller)...');
  const projectRes = await fetch(`${BASE_URL}/api/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      genre: 'action_thriller',
      language: 'es',
      customPrompt: 'Pablo y Esteban son agentes del Mossad encubiertos en Buenos Aires. Deben recuperar un USB con información clasificada antes de que caiga en manos equivocadas.',
    }),
  });

  if (!projectRes.ok) {
    const err = await projectRes.text();
    console.error('❌ Error creando proyecto:', err);
    process.exit(1);
  }

  const { id: projectId } = await projectRes.json();
  console.log(`  ✅ Proyecto creado: ${projectId}`);

  // Subir personajes
  console.log('\n👥 Subiendo personajes...');
  for (let i = 0; i < characters.length; i++) {
    const char = characters[i];
    const formData = new FormData();
    formData.append('projectId', projectId);
    formData.append('name', char.name);
    formData.append('orderIndex', String(i));

    const fileBuffer = readFileSync(char.file);
    const blob = new Blob([fileBuffer], { type: 'image/jpeg' });
    formData.append('photos', blob, `${char.name.toLowerCase()}.jpg`);

    const charRes = await fetch(`${BASE_URL}/api/characters`, {
      method: 'POST',
      body: formData,
    });

    if (!charRes.ok) {
      const err = await charRes.text();
      console.error(`❌ Error subiendo ${char.name}:`, err);
      process.exit(1);
    }

    const charData = await charRes.json();
    console.log(`  ✅ ${char.name}: ${charData.id}`);
  }

  // Iniciar orquestador
  console.log('\n🚀 Iniciando pipeline (esto tarda ~5-10 min)...');
  console.log('   Fases: fotos → guión Claude → 7 escenas Kling → FFmpeg\n');

  const orchRes = await fetch(`${BASE_URL}/api/orchestrator`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId }),
  });

  if (!orchRes.ok) {
    const err = await orchRes.text();
    console.error('❌ Error iniciando orquestador:', err);
    process.exit(1);
  }

  console.log('  ✅ Orquestador corriendo en background');
  console.log(`  🌐 Ver en vivo: ${BASE_URL}/create/${projectId}\n`);

  // Polling de estado
  let lastStatus = '';
  let scriptShown = false;
  let iteration = 0;
  const MAX_WAIT_MINUTES = 15;

  while (iteration < MAX_WAIT_MINUTES * 60 / 8) {
    await sleep(8000);
    iteration++;

    let project;
    try {
      const statusRes = await fetch(`${BASE_URL}/api/projects?id=${projectId}`);
      project = await statusRes.json();
    } catch (e) {
      process.stdout.write('.');
      continue;
    }

    const completedScenes = (project.scenes || []).filter(s => s.status === 'complete').length;
    const totalScenes = (project.scenes || []).length;

    // Mostrar guión cuando aparezca
    if (project.scriptJson && !scriptShown) {
      scriptShown = true;
      console.log(`\n  🎭 Título: "${project.scriptJson.title}"`);
      console.log(`  💬 Tagline: "${project.scriptJson.tagline}"`);
      if (project.scriptJson.scenes) {
        console.log(`  📜 Escenas generadas: ${project.scriptJson.scenes.length}`);
      }
      console.log();
    }

    if (project.status !== lastStatus) {
      const labels = {
        draft: '⏳ Iniciando...',
        generating_script: '📝 Generando guión con Claude...',
        generating_scenes: `🎬 Generando escenas con Kling (${completedScenes}/${totalScenes})`,
        assembling: '🔧 Ensamblando con FFmpeg...',
        complete: '✅ ¡Listo!',
        failed: '❌ Falló',
      };
      if (project.status !== 'generating_scenes') {
        console.log(`  ${labels[project.status] || project.status}`);
      }
      lastStatus = project.status;
    } else if (project.status === 'generating_scenes') {
      process.stdout.write(`\r  🎬 Escenas: ${completedScenes}/${totalScenes} completadas  `);
    } else {
      process.stdout.write('.');
    }

    if (project.status === 'complete') {
      console.log('\n');
      console.log('═'.repeat(60));
      console.log('🎬  ¡TRAILER LISTO!');
      console.log('═'.repeat(60));
      if (project.scriptJson) {
        console.log(`📽️   Título    : ${project.scriptJson.title}`);
        console.log(`💬   Tagline   : ${project.scriptJson.tagline}`);
      }
      console.log(`🌐   URL       : ${BASE_URL}/create/${projectId}`);
      if (project.outputVideoUrl) {
        console.log(`📥   Descargar : ${BASE_URL}${project.outputVideoUrl}`);
      }
      console.log('═'.repeat(60));
      break;
    }

    if (project.status === 'failed') {
      console.log('\n');
      console.log('❌ El pipeline falló.');
      console.log(`🌐 Ver detalles: ${BASE_URL}/create/${projectId}`);

      // Mostrar estado de escenas si hay
      if (project.scenes?.length > 0) {
        console.log('\nEstado de escenas:');
        project.scenes.forEach(s => {
          console.log(`  Escena ${s.orderIndex + 1}: ${s.status}`);
        });
      }
      break;
    }
  }

  if (iteration >= MAX_WAIT_MINUTES * 60 / 8) {
    console.log(`\n⚠️  Timeout de ${MAX_WAIT_MINUTES} min. El proceso sigue corriendo en background.`);
    console.log(`🌐 Revisá: ${BASE_URL}/create/${projectId}`);
  }
}

main().catch(err => {
  console.error('\n❌ Error fatal:', err);
  process.exit(1);
});
