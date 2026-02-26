export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { projects, characters, scenes } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { genre, language = 'es', customPrompt } = body;

    if (!genre) {
      return NextResponse.json({ error: 'Genre is required' }, { status: 400 });
    }

    const id = uuidv4();
    await db.insert(projects).values({
      id,
      genre,
      language,
      customPrompt: customPrompt || null,
      status: 'draft',
    });

    return NextResponse.json({ id });
  } catch (error) {
    console.error('Create project error:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    }

    const project = await db.select().from(projects).where(eq(projects.id, id)).get();
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const chars = await db.select().from(characters).where(eq(characters.projectId, id));
    const sceneList = await db.select().from(scenes).where(eq(scenes.projectId, id));

    return NextResponse.json({
      ...project,
      scriptJson: project.scriptJson ? JSON.parse(project.scriptJson) : null,
      characters: chars.map(c => ({
        ...c,
        originalPhotos: JSON.parse(c.originalPhotos),
        processedPhotos: JSON.parse(c.processedPhotos),
      })),
      scenes: sceneList.sort((a, b) => a.orderIndex - b.orderIndex),
    });
  } catch (error) {
    console.error('Get project error:', error);
    return NextResponse.json({ error: 'Failed to get project' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    }

    await db.update(projects)
      .set({ ...updates, updatedAt: Math.floor(Date.now() / 1000) })
      .where(eq(projects.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update project error:', error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}
