export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { characters } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { processCharacterPhotos } from '@/lib/image/background-removal';
import path from 'path';
import { mkdir } from 'fs/promises';

export async function POST(req: NextRequest) {
  try {
    const { characterId } = await req.json();

    if (!characterId) {
      return NextResponse.json({ error: 'characterId required' }, { status: 400 });
    }

    const character = await db.select().from(characters).where(eq(characters.id, characterId)).get();
    if (!character) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 });
    }

    const originalPhotos: string[] = JSON.parse(character.originalPhotos);

    // Convert API paths to filesystem paths
    const fsPaths = originalPhotos.map(apiPath => {
      // /api/files/uploads/projectId/charId/filename → storage/uploads/...
      const relativePath = apiPath.replace('/api/files/', '');
      return path.join(process.cwd(), 'storage', relativePath);
    });

    const processedDir = path.join(
      process.cwd(), 'storage', 'processed',
      character.projectId, character.id
    );
    await mkdir(processedDir, { recursive: true });

    const processedPaths = await processCharacterPhotos(fsPaths, processedDir);

    // Convert back to API paths
    const processedApiPaths = processedPaths.map(fsPath => {
      const relative = fsPath.replace(path.join(process.cwd(), 'storage'), '').replace(/\\/g, '/');
      return `/api/files${relative}`;
    });

    await db.update(characters)
      .set({ processedPhotos: JSON.stringify(processedApiPaths) })
      .where(eq(characters.id, characterId));

    return NextResponse.json({ processedPhotos: processedApiPaths });
  } catch (error) {
    console.error('Background removal error:', error);
    return NextResponse.json({ error: 'Background removal failed' }, { status: 500 });
  }
}
