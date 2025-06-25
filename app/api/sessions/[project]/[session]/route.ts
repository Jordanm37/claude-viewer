import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'

/**
 * GET /api/sessions/[project]/[session]
 * 
 * Fetches the content of a specific Claude conversation session.
 * Reads the JSONL file and extracts all user and assistant messages.
 * 
 * @param request - The incoming request object
 * @param params - Route parameters containing project name and session ID
 * @returns {Promise<NextResponse>} JSON response with array of messages
 * 
 * Message format:
 * - role: 'user' | 'assistant' | 'system'
 * - content: Message content (string or array of content items)
 * - timestamp: ISO timestamp of the message
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ project: string; session: string }> }
) {
  try {
    const { project, session } = await params
    const homeDir = os.homedir()
    const sessionPath = path.join(
      homeDir, 
      '.claude', 
      'projects', 
      project, 
      `${session}.jsonl`
    )
    
    // Reading session from: sessionPath
    
    // Check if file exists
    try {
      await fs.access(sessionPath)
    } catch {
      // Session file not found
      return NextResponse.json({ error: 'Session file not found' }, { status: 404 })
    }
    
    const content = await fs.readFile(sessionPath, 'utf-8')
    const lines = content.trim().split('\n').filter(line => line.trim())
    
    // Found ${lines.length} lines in session file
    
    const parsedLines = lines.map((line, index) => {
      try {
        return JSON.parse(line)
      } catch (e) {
        // Failed to parse line ${index + 1}
        return null
      }
    }).filter(Boolean)
    
    // Successfully parsed ${parsedLines.length} lines
    
    // Extract messages from the parsed data
    const messages = parsedLines
      .filter(item => item.message && (item.type === 'user' || item.type === 'assistant'))
      .map(item => ({
        role: item.type,
        content: item.message.content,
        timestamp: item.timestamp
      }))
    
    // Extracted ${messages.length} messages
    
    return NextResponse.json({ messages })
  } catch (error) {
    // Error reading session
    return NextResponse.json({ 
      error: 'Failed to read session', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}