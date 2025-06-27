import { NextResponse } from 'next/server';
import { getAllSessionFiles, buildSessionThread } from '@/lib/session-parser';
import path from 'path';
import os from 'os';

export async function GET(
  request: Request,
  { params }: { params: { sessionId: string } }
) {
  try {
    const claudeProjectsDir = path.join(os.homedir(), '.claude', 'projects');
    const allFiles = await getAllSessionFiles(claudeProjectsDir);
    const thread = await buildSessionThread(params.sessionId, allFiles);
    
    return NextResponse.json(thread);
  } catch (error) {
    console.error('Error loading session thread:', error);
    return NextResponse.json(
      { error: 'Failed to load session thread' },
      { status: 500 }
    );
  }
}