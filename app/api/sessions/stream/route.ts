import { NextRequest, NextResponse } from 'next/server';
import chokidar from 'chokidar';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';

export async function GET(request: NextRequest) {
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const claudeProjectsDir = path.join(os.homedir(), '.claude', 'projects');
      
      // Track file positions for incremental reads
      const filePositions = new Map<string, number>();
      
      // Set up file watcher
      const watcher = chokidar.watch(`${claudeProjectsDir}/**/*.jsonl`, {
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: {
          stabilityThreshold: 100,
          pollInterval: 50
        }
      });
      
      // Send heartbeat every 30 seconds
      const heartbeatInterval = setInterval(() => {
        try {
          const heartbeat = JSON.stringify({
            type: 'heartbeat',
            timestamp: new Date().toISOString()
          });
          controller.enqueue(encoder.encode(`data: ${heartbeat}\n\n`));
        } catch (e) {
          // Client disconnected
          clearInterval(heartbeatInterval);
          watcher.close();
        }
      }, 30000);
      
      // Handle file changes
      watcher.on('change', async (filepath) => {
        try {
          const lastPos = filePositions.get(filepath) || 0;
          const stats = await fs.stat(filepath);
          
          if (stats.size > lastPos) {
            // Read only new content
            const buffer = Buffer.alloc(stats.size - lastPos);
            const fileHandle = await fs.open(filepath, 'r');
            await fileHandle.read(buffer, 0, buffer.length, lastPos);
            await fileHandle.close();
            
            const newContent = buffer.toString('utf8');
            const newLines = newContent.split('\n').filter(line => line.trim());
            
            filePositions.set(filepath, stats.size);
            
            // Parse new messages
            const messages = [];
            for (const line of newLines) {
              try {
                messages.push(JSON.parse(line));
              } catch {
                // Skip invalid JSON
              }
            }
            
            if (messages.length > 0) {
              const sessionId = path.basename(filepath, '.jsonl');
              const project = path.basename(path.dirname(filepath));
              
              // Send multiple formats to handle different ID conventions
              const data = JSON.stringify({
                type: 'new_messages',
                sessionId,
                fullSessionId: `${project}/${sessionId}`,
                project,
                messages,
                messageCount: messages.length,
                timestamp: new Date().toISOString()
              });
              
              console.log('[SSE] Sending new_messages event:', { sessionId, project, messageCount: messages.length });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          }
        } catch (error) {
          console.error('Error processing file change:', error);
        }
      });
      
      // Handle new files
      watcher.on('add', async (filepath) => {
        try {
          const sessionId = path.basename(filepath, '.jsonl');
          const project = path.basename(path.dirname(filepath));
          
          const data = JSON.stringify({
            type: 'new_session',
            sessionId,
            project,
            timestamp: new Date().toISOString()
          });
          
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        } catch (error) {
          console.error('Error processing new file:', error);
        }
      });
      
      // Cleanup on disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeatInterval);
        watcher.close();
      });
    }
  });
  
  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}