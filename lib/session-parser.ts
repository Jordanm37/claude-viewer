import { SessionMessage, SessionFile, SessionThread } from '@/types/session';
import fs from 'fs/promises';
import path from 'path';

export async function parseSessionFile(filepath: string): Promise<SessionFile> {
  const content = await fs.readFile(filepath, 'utf8');
  const lines = content.trim().split('\n').filter(line => line);
  
  const messages: SessionMessage[] = [];
  const summaries: SessionMessage[] = [];
  let rootSessionId: string | null = null;
  let isRoot = true;
  
  for (const line of lines) {
    try {
      const entry = JSON.parse(line) as SessionMessage;
      
      if (entry.type === 'summary') {
        summaries.push(entry);
      } else {
        messages.push(entry);
        
        // Detect if this is a continuation session
        if (entry.sessionId && entry.sessionId !== path.basename(filepath, '.jsonl')) {
          isRoot = false;
          rootSessionId = entry.sessionId;
        } else if (!rootSessionId && entry.sessionId) {
          rootSessionId = entry.sessionId;
        }
      }
    } catch (e) {
      console.error(`Error parsing line in ${filepath}:`, e);
    }
  }
  
  const sessionId = path.basename(filepath, '.jsonl');
  const project = path.basename(path.dirname(filepath));
  
  return {
    id: sessionId,
    project,
    filepath,
    messages,
    summaries,
    rootSessionId: rootSessionId || sessionId,
    isRoot,
    continuationOf: isRoot ? undefined : rootSessionId || undefined
  };
}

export async function buildSessionThread(
  rootSessionId: string,
  allFiles: SessionFile[]
): Promise<SessionThread> {
  // Find all files that belong to this thread
  const threadFiles = allFiles.filter(
    file => file.rootSessionId === rootSessionId || file.id === rootSessionId
  );
  
  // Sort files by first message timestamp
  threadFiles.sort((a, b) => {
    const aTime = a.messages[0]?.timestamp || '';
    const bTime = b.messages[0]?.timestamp || '';
    return aTime.localeCompare(bTime);
  });
  
  // Combine all messages and summaries
  const allMessages: SessionMessage[] = [];
  const allSummaries: SessionMessage[] = [];
  
  for (const file of threadFiles) {
    allMessages.push(...file.messages);
    allSummaries.push(...file.summaries);
  }
  
  // Sort messages by timestamp
  allMessages.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  
  // Get title from first summary or first user message
  let title = allSummaries[0]?.summary;
  if (!title) {
    const firstUserMessage = allMessages.find(m => m.type === 'user');
    if (firstUserMessage?.message?.content) {
      const content = typeof firstUserMessage.message.content === 'string' 
        ? firstUserMessage.message.content 
        : firstUserMessage.message.content[0]?.text || '';
      title = content.slice(0, 100) + (content.length > 100 ? '...' : '');
    }
  }
  
  return {
    rootSessionId,
    files: threadFiles,
    messages: allMessages,
    summaries: allSummaries,
    title
  };
}

export async function getAllSessionFiles(projectsDir: string): Promise<SessionFile[]> {
  const allFiles: SessionFile[] = [];
  
  try {
    const projects = await fs.readdir(projectsDir);
    
    for (const project of projects) {
      const projectPath = path.join(projectsDir, project);
      const stats = await fs.stat(projectPath);
      
      if (stats.isDirectory()) {
        const files = await fs.readdir(projectPath);
        const jsonlFiles = files.filter(f => f.endsWith('.jsonl'));
        
        for (const file of jsonlFiles) {
          try {
            const sessionFile = await parseSessionFile(path.join(projectPath, file));
            allFiles.push(sessionFile);
          } catch (e) {
            console.error(`Error parsing ${file}:`, e);
          }
        }
      }
    }
  } catch (e) {
    console.error('Error reading projects directory:', e);
  }
  
  return allFiles;
}

export async function getSessionThreads(projectsDir: string): Promise<SessionThread[]> {
  const allFiles = await getAllSessionFiles(projectsDir);
  
  // Group by root session ID
  const threadMap = new Map<string, SessionFile[]>();
  
  for (const file of allFiles) {
    const rootId = file.rootSessionId;
    if (!threadMap.has(rootId)) {
      threadMap.set(rootId, []);
    }
    threadMap.get(rootId)!.push(file);
  }
  
  // Build threads
  const threads: SessionThread[] = [];
  for (const [rootId, files] of threadMap) {
    const thread = await buildSessionThread(rootId, files);
    threads.push(thread);
  }
  
  // Sort threads by most recent message
  threads.sort((a, b) => {
    const aLatest = a.messages[a.messages.length - 1]?.timestamp || '';
    const bLatest = b.messages[b.messages.length - 1]?.timestamp || '';
    return bLatest.localeCompare(aLatest);
  });
  
  return threads;
}