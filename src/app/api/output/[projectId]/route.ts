export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const filePath = path.join(process.cwd(), 'storage', 'output', projectId, 'trailer.mp4');

    const buffer = await readFile(filePath);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="friendflix-trailer.mp4"`,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Video not found' }, { status: 404 });
  }
}
