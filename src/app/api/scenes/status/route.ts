export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { scenes } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sceneId = searchParams.get('sceneId');

    if (!sceneId) {
      return NextResponse.json({ error: 'sceneId required' }, { status: 400 });
    }

    const scene = await db.select().from(scenes).where(eq(scenes.id, sceneId)).get();
    if (!scene) {
      return NextResponse.json({ error: 'Scene not found' }, { status: 404 });
    }

    return NextResponse.json({ status: scene.status, videoUrl: scene.videoUrl });
  } catch (error) {
    console.error('Scene status error:', error);
    return NextResponse.json({ error: 'Failed to check scene status' }, { status: 500 });
  }
}
