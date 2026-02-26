export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { projects, characters, scenes } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateScript } from '@/lib/ai/script-generator';
import { generateScene } from '@/lib/video/scene-generator';
import { processCharacterPhotos } from '@/lib/image/background-removal';
import { getGenre } from '@/lib/genres';
import type { Script } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { mkdir } from 'fs/promises';

async function runOrchestration(projectId: string) {
  const project = await db.select().from(projects).where(eq(projects.id, projectId)).get();
  if (!project) throw new Error('Project not found');

  const genre = getGenre(project.genre);
  if (!genre) throw new Error('Invalid genre');

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  try {
    // Step 1: Process character photos (background removal)
    const chars = await db.select().from(characters).where(eq(characters.projectId, projectId));

    for (const char of chars) {
      const originalPhotos: string[] = JSON.parse(char.originalPhotos);
      const fsPaths = originalPhotos.map(apiPath => {
        const relativePath = apiPath.replace('/api/files/', '');
        return path.join(process.cwd(), 'storage', relativePath);
      });

      const processedDir = path.join(
        process.cwd(), 'storage', 'processed',
        projectId, char.id
      );
      await mkdir(processedDir, { recursive: true });

      const processedPaths = await processCharacterPhotos(fsPaths, processedDir);
      const processedApiPaths = processedPaths.map(fsPath => {
        const relative = fsPath.replace(path.join(process.cwd(), 'storage'), '').replace(/\\/g, '/');
        return `/api/files${relative}`;
      });

      await db.update(characters)
        .set({ processedPhotos: JSON.stringify(processedApiPaths) })
        .where(eq(characters.id, char.id));
    }

    // Step 2: Generate script with Claude
    await db.update(projects)
      .set({ status: 'generating_script', updatedAt: Math.floor(Date.now() / 1000) })
      .where(eq(projects.id, projectId));

    const freshChars = await db.select().from(characters).where(eq(characters.projectId, projectId));
    const characterData = freshChars.map(c => ({
      id: c.id,
      name: c.name,
      originalPhotos: JSON.parse(c.originalPhotos),
      processedPhotos: JSON.parse(c.processedPhotos),
    }));

    const script = await generateScript(genre, characterData, project.customPrompt || undefined);

    await db.update(projects)
      .set({
        scriptJson: JSON.stringify(script),
        updatedAt: Math.floor(Date.now() / 1000),
      })
      .where(eq(projects.id, projectId));

    // Step 3: Generate all scenes in parallel
    await db.update(projects)
      .set({ status: 'generating_scenes', updatedAt: Math.floor(Date.now() / 1000) })
      .where(eq(projects.id, projectId));

    // Insert all scene records first (so the UI can show them immediately)
    const sceneIds: string[] = [];
    for (const sceneScript of script.scenes) {
      const sceneId = uuidv4();
      await db.insert(scenes).values({
        id: sceneId,
        projectId,
        orderIndex: sceneScript.sceneNumber - 1,
        prompt: sceneToPromptSummary(sceneScript),
        status: 'generating',
        duration: sceneScript.duration,
      });
      sceneIds.push(sceneId);
    }

    // Step 4: Run all scenes in parallel — fal.subscribe() handles polling internally
    const sceneResults = await Promise.allSettled(
      script.scenes.map(async (sceneScript, index) => {
        const sceneId = sceneIds[index];
        const videoUrl = await generateScene(sceneScript, genre, characterData, baseUrl, (status) => {
          console.log(`  Scene ${sceneScript.sceneNumber} status: ${status}`);
        });
        await db.update(scenes)
          .set({ status: 'complete', videoUrl })
          .where(eq(scenes.id, sceneId));
        return { sceneId, videoUrl };
      })
    );

    // Mark failed scenes
    for (let i = 0; i < sceneResults.length; i++) {
      const result = sceneResults[i];
      if (result.status === 'rejected') {
        const err = result.reason as { message?: string; body?: unknown; status?: number };
        console.error(`Scene ${i + 1} failed: ${err?.message}`);
        if (err?.body) console.error(`  → fal.ai body:`, JSON.stringify(err.body, null, 2));
        if (err?.status) console.error(`  → HTTP status:`, err.status);
        await db.update(scenes)
          .set({ status: 'failed' })
          .where(eq(scenes.id, sceneIds[i]));
      }
    }

    // Step 5: Use the generated scene video directly as output
    const completedScenes = await db.select().from(scenes)
      .where(eq(scenes.projectId, projectId));
    const readyScenes = completedScenes.filter(s => s.status === 'complete' && s.videoUrl);

    if (readyScenes.length === 0) {
      throw new Error('No scenes completed successfully');
    }

    // Use the first (and typically only) completed scene video as the output
    const outputUrl = readyScenes.sort((a, b) => a.orderIndex - b.orderIndex)[0].videoUrl!;

    await db.update(projects)
      .set({
        status: 'complete',
        outputVideoUrl: outputUrl,
        updatedAt: Math.floor(Date.now() / 1000),
      })
      .where(eq(projects.id, projectId));

  } catch (error) {
    console.error('Orchestration error:', error);
    await db.update(projects)
      .set({ status: 'failed', updatedAt: Math.floor(Date.now() / 1000) })
      .where(eq(projects.id, projectId));
    throw error;
  }
}

function sceneToPromptSummary(scene: Script['scenes'][0]): string {
  return `Scene ${scene.sceneNumber}: ${scene.visualDescription.substring(0, 100)}`;
}

export async function POST(req: NextRequest) {
  try {
    const { projectId } = await req.json();

    if (!projectId) {
      return NextResponse.json({ error: 'projectId required' }, { status: 400 });
    }

    // Run orchestration in background (don't await)
    runOrchestration(projectId).catch(err => {
      console.error('Background orchestration failed:', err);
    });

    return NextResponse.json({ message: 'Orchestration started', projectId });
  } catch (error) {
    console.error('Orchestrator start error:', error);
    return NextResponse.json({ error: 'Failed to start orchestration' }, { status: 500 });
  }
}
