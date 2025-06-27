import { NextResponse } from 'next/server';
import { getSessionThreads } from '@/lib/session-parser';
import path from 'path';
import os from 'os';

export async function GET() {
  try {
    const claudeProjectsDir = path.join(os.homedir(), '.claude', 'projects');
    const threads = await getSessionThreads(claudeProjectsDir);
    
    // Group threads by project
    const projectMap = new Map<string, any>();
    
    for (const thread of threads) {
      // Get project name from first file
      const projectName = thread.files[0]?.project || 'unknown';
      
      if (!projectMap.has(projectName)) {
        projectMap.set(projectName, {
          name: projectName,
          sessions: []
        });
      }
      
      projectMap.get(projectName)!.sessions.push({
        id: thread.rootSessionId,
        title: thread.title || 'Untitled Session',
        messageCount: thread.messages.length,
        fileCount: thread.files.length,
        lastUpdated: thread.messages[thread.messages.length - 1]?.timestamp || new Date().toISOString(),
        firstMessage: thread.messages[0]?.timestamp || new Date().toISOString(),
      });
    }
    
    const projects = Array.from(projectMap.values()).sort((a, b) => 
      a.name.localeCompare(b.name)
    );
    
    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Error loading sessions:', error);
    return NextResponse.json(
      { error: 'Failed to load sessions' },
      { status: 500 }
    );
  }
}