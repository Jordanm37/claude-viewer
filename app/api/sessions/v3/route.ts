import { NextResponse } from 'next/server';
import { getSessionThreads } from '@/lib/session-parser';
import { buildProjectTree } from '@/lib/project-tree-builder';
import path from 'path';
import os from 'os';

export async function GET() {
  try {
    const claudeProjectsDir = path.join(os.homedir(), '.claude', 'projects');
    const threads = await getSessionThreads(claudeProjectsDir);
    const tree = buildProjectTree(threads);
    
    return NextResponse.json({ 
      fileTree: tree.children,
      totalSessions: threads.length
    });
  } catch (error) {
    console.error('Error loading sessions:', error);
    return NextResponse.json(
      { error: 'Failed to load sessions' },
      { status: 500 }
    );
  }
}