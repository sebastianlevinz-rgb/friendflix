export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { scenes, characters, projects } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateScene } from '@/lib/video/scene-generator';
import { getGenre } from '@/lib/genres';
import type { Script } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    const { projectId } = await req.json();

    if (!projectId) {
      return NextResponse.json({ error: 'projectId required' }, { status: 400 });
    }

    const project = await db.select().from(projects).where(eq(projects.id, projectId)).get();
    if (!project || !project.scriptJson) {
      return NextResponse.json({ error: 'Project or script not found' }, { status: 404 });
    }

    const genre = getGenre(project.genre);
    if (!genre) {
      return NextResponse.json({ error: 'Invalid genre' }, { status: 400 });
    }

    const script: Script = JSON.parse(project.scriptJson);
    const chars = await db.select().from(characters).where(eq(characters.projectId, projectId));
    const characterData = chars.map(c => ({
      id: c.id,
      name: c.name,
      originalPhotos: JSON.parse(c.originalPhotos),
      processedPhotos: JSON.parse(c.processedPhotos),
    }));

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Create scene records and start generation for all scenes
    const sceneIds: string[] = [];
    for (const sceneScript of script.scenes) {
      const sceneId = uuidv4();
      sceneIds.push(sceneId);

      await db.insert(scenes).values({
        id: sceneId,
        projectId,
        orderIndex: sceneScript.sceneNumber - 1,
        prompt: `Scene ${sceneScript.sceneNumber}`,
        status: 'generating',
        duration: sceneScript.duration,
      });

      // Submit to Kling
      const requestId = await generateScene(sceneScript, genre, characterData, baseUrl);

      await db.update(scenes)
        .set({ falRequestId: requestId })
        .where(eq(scenes.id, sceneId));
    }

    await db.update(projects)
      .set({ status: 'generating_scenes', updatedAt: Math.floor(Date.now() / 1000) })
      .where(eq(projects.id, projectId));

    return NextResponse.json({ sceneIds, message: 'Scene generation started' });
  } catch (error) {
    console.error('Scene generation error:', error);
    return NextResponse.json({ error: 'Scene generation failed' }, { status: 500 });
  }
}
