export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { projects, scenes } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { assembleTrailer } from '@/lib/video/assembler';
import { getGenre } from '@/lib/genres';
import type { Script } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const { projectId } = await req.json();

    if (!projectId) {
      return NextResponse.json({ error: 'projectId required' }, { status: 400 });
    }

    const project = await db.select().from(projects).where(eq(projects.id, projectId)).get();
    if (!project || !project.scriptJson) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const genre = getGenre(project.genre);
    if (!genre) {
      return NextResponse.json({ error: 'Invalid genre' }, { status: 400 });
    }

    const sceneList = await db.select().from(scenes).where(eq(scenes.projectId, projectId));
    const completedScenes = sceneList.filter(s => s.status === 'complete' && s.videoUrl);

    if (completedScenes.length === 0) {
      return NextResponse.json({ error: 'No completed scenes' }, { status: 400 });
    }

    const script: Script = JSON.parse(project.scriptJson);

    // Update status
    await db.update(projects)
      .set({ status: 'assembling', updatedAt: Math.floor(Date.now() / 1000) })
      .where(eq(projects.id, projectId));

    // Assemble trailer
    const outputUrl = await assembleTrailer(projectId, completedScenes, genre, script);

    // Update project with output URL
    await db.update(projects)
      .set({
        status: 'complete',
        outputVideoUrl: outputUrl,
        updatedAt: Math.floor(Date.now() / 1000),
      })
      .where(eq(projects.id, projectId));

    return NextResponse.json({ outputUrl });
  } catch (error) {
    console.error('Assembly error:', error);
    await db.update(projects)
      .set({ status: 'failed', updatedAt: Math.floor(Date.now() / 1000) })
      .where(eq(projects.id, (await req.json().catch(() => ({}))).projectId || ''));
    return NextResponse.json({ error: 'Assembly failed' }, { status: 500 });
  }
}
