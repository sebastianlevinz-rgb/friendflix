export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { projects, characters } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateScript } from '@/lib/ai/script-generator';
import { getGenre } from '@/lib/genres';

export async function POST(req: NextRequest) {
  let projectId: string | undefined;
  try {
    ({ projectId } = await req.json());

    if (!projectId) {
      return NextResponse.json({ error: 'projectId required' }, { status: 400 });
    }

    const project = await db.select().from(projects).where(eq(projects.id, projectId)).get();
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const genre = getGenre(project.genre);
    if (!genre) {
      return NextResponse.json({ error: 'Invalid genre' }, { status: 400 });
    }

    const chars = await db.select().from(characters).where(eq(characters.projectId, projectId));
    const characterData = chars.map(c => ({
      id: c.id,
      name: c.name,
      originalPhotos: JSON.parse(c.originalPhotos),
      processedPhotos: JSON.parse(c.processedPhotos),
    }));

    if (characterData.length < 2) {
      return NextResponse.json({ error: 'At least 2 characters required' }, { status: 400 });
    }

    // Update status
    await db.update(projects)
      .set({ status: 'generating_script', updatedAt: Math.floor(Date.now() / 1000) })
      .where(eq(projects.id, projectId));

    // Generate script
    const script = await generateScript(genre, characterData, project.customPrompt || undefined);

    // Save script to DB
    await db.update(projects)
      .set({
        scriptJson: JSON.stringify(script),
        updatedAt: Math.floor(Date.now() / 1000),
      })
      .where(eq(projects.id, projectId));

    return NextResponse.json({ script });
  } catch (error) {
    console.error('Script generation error:', error);
    if (projectId) {
      await db.update(projects)
        .set({ status: 'failed', updatedAt: Math.floor(Date.now() / 1000) })
        .where(eq(projects.id, projectId));
    }
    return NextResponse.json({ error: 'Script generation failed' }, { status: 500 });
  }
}
