export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { characters } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const projectId = formData.get('projectId') as string;
    const name = formData.get('name') as string;
    const orderIndex = parseInt(formData.get('orderIndex') as string) || 0;
    const files = formData.getAll('photos') as File[];

    if (!projectId || !name) {
      return NextResponse.json({ error: 'projectId and name are required' }, { status: 400 });
    }

    if (files.length === 0) {
      return NextResponse.json({ error: 'At least one photo is required' }, { status: 400 });
    }

    const charId = uuidv4();
    const uploadDir = path.join(process.cwd(), 'storage', 'uploads', projectId, charId);
    await mkdir(uploadDir, { recursive: true });

    const savedPaths: string[] = [];

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const ext = file.name.split('.').pop() || 'jpg';
      const filename = `${uuidv4()}.${ext}`;
      const filePath = path.join(uploadDir, filename);
      await writeFile(filePath, buffer);
      savedPaths.push(`/api/files/uploads/${projectId}/${charId}/${filename}`);
    }

    await db.insert(characters).values({
      id: charId,
      projectId,
      name,
      originalPhotos: JSON.stringify(savedPaths),
      processedPhotos: JSON.stringify([]),
      orderIndex,
    });

    return NextResponse.json({
      id: charId,
      name,
      originalPhotos: savedPaths,
      processedPhotos: [],
    });
  } catch (error) {
    console.error('Character upload error:', error);
    return NextResponse.json({ error: 'Failed to upload character' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'projectId required' }, { status: 400 });
    }

    const chars = await db.select().from(characters).where(eq(characters.projectId, projectId));

    return NextResponse.json(chars.map(c => ({
      ...c,
      originalPhotos: JSON.parse(c.originalPhotos),
      processedPhotos: JSON.parse(c.processedPhotos),
    })));
  } catch (error) {
    console.error('Get characters error:', error);
    return NextResponse.json({ error: 'Failed to get characters' }, { status: 500 });
  }
}
