import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'

/**
 * GET /api/sessions/find/[sessionId]
 * 
 * Searches for a session ID across all projects.
 * Used for direct session links where the project name is unknown.
 * 
 * @param request - The incoming request object
 * @param params - Route parameters containing the session ID to find
 * @returns {Promise<NextResponse>} JSON response with search results
 * 
 * Success response:
 * - found: true
 * - projectName: The project containing the session
 * - sessionId: The session ID
 * 
 * Not found response (404):
 * - found: false
 * - error: 'Session not found'
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params
    const homeDir = os.homedir()
    const claudeProjectsPath = path.join(homeDir, '.claude', 'projects')
    
    // Search all projects for this session ID
    const projects = await fs.readdir(claudeProjectsPath)
    
    for (const projectName of projects) {
      if (projectName.startsWith('.')) continue
      
      const projectPath = path.join(claudeProjectsPath, projectName)
      const stats = await fs.stat(projectPath)
      
      if (!stats.isDirectory()) continue
      
      // Check if session exists in this project
      const sessionPath = path.join(projectPath, `${sessionId}.jsonl`)
      
      try {
        await fs.access(sessionPath)
        // Found it!
        return NextResponse.json({ 
          found: true,
          projectName,
          sessionId 
        })
      } catch {
        // Not in this project, continue searching
      }
    }
    
    return NextResponse.json({ 
      found: false,
      error: 'Session not found' 
    }, { status: 404 })
    
  } catch (error) {
    console.error('Error finding session:', error)
    return NextResponse.json({ 
      error: 'Failed to find session' 
    }, { status: 500 })
  }
}