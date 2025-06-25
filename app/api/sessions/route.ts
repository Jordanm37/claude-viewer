import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'

/**
 * GET /api/sessions
 * 
 * Fetches all Claude conversation sessions from the user's ~/.claude/projects directory.
 * Groups projects by their parent directory and returns them organized by category.
 * 
 * @returns {Promise<NextResponse>} JSON response containing grouped projects with their sessions
 * @returns {Object} response.groupedProjects - Projects organized by group (e.g., 'discord', 'solana', 'Home')
 * 
 * Each project contains:
 * - name: Original directory name
 * - displayName: Human-readable name
 * - sessions: Array of session objects with id, filename, modified date, size, and title
 */
export async function GET() {
  try {
    const homeDir = os.homedir()
    const claudeProjectsPath = path.join(homeDir, '.claude', 'projects')
    
    // Check if the Claude projects directory exists
    try {
      await fs.access(claudeProjectsPath)
    } catch {
      return NextResponse.json({ 
        fileTree: [],
        error: 'Claude projects directory not found. Please ensure Claude Code or Claude Desktop is installed and has created session files.'
      })
    }
    
    // Read all project directories from Claude's projects folder
    const projects = await fs.readdir(claudeProjectsPath)
    
    // Process each project directory to extract session information
    const projectData = await Promise.all(
      projects.map(async (projectName) => {
        // Skip hidden files/directories
        if (projectName.startsWith('.')) return null
        
        const projectPath = path.join(claudeProjectsPath, projectName)
        const stats = await fs.stat(projectPath)
        
        if (!stats.isDirectory()) return null
        
        // Get all JSONL session files in the project directory
        const sessions = await fs.readdir(projectPath)
        const jsonlSessions = sessions.filter(s => s.endsWith('.jsonl'))
        
        // Extract metadata and title from each session file
        const sessionData = await Promise.all(
          jsonlSessions.map(async (sessionFile) => {
            const sessionPath = path.join(projectPath, sessionFile)
            const sessionStats = await fs.stat(sessionPath)
            
            // Attempt to extract a meaningful title from the session content
            let title = 'Untitled Session'
            try {
              const content = await fs.readFile(sessionPath, 'utf-8')
              const lines = content.split('\n').filter(line => line.trim())
              
              // First, look for a 'summary' property in any line of the JSONL
              for (const line of lines) {
                try {
                  const parsed = JSON.parse(line)
                  if (parsed.summary) {
                    title = parsed.summary
                    break
                  }
                } catch (e) {
                  // Skip lines that don't parse
                }
              }
              
              // Fallback: Extract title from the first user message if no summary exists
              if (title === 'Untitled Session' && lines.length > 0) {
                const firstLine = lines[0]
                const parsed = JSON.parse(firstLine)
                if (parsed.message && parsed.message.content) {
                  const messageContent = parsed.message.content
                  // Handle structured content (array of content items)
                  if (Array.isArray(messageContent)) {
                    const textContent = messageContent.find(item => item.type === 'text')
                    if (textContent && textContent.text) {
                      // Truncate and clean the text for display
                      title = textContent.text
                        .replace(/\n/g, ' ')
                        .substring(0, 80)
                        .trim() + '...'
                    }
                  }
                }
              }
            } catch (e) {
              // Error extracting title
            }
            
            return {
              id: sessionFile.replace('.jsonl', ''),
              filename: sessionFile,
              modified: sessionStats.mtime,
              size: sessionStats.size,
              title
            }
          })
        )
        
        return {
          name: projectName,
          displayName: projectName.replace(/-/g, ' ').replace(/^-/, ''),
          sessions: sessionData.sort((a, b) => 
            b.modified.getTime() - a.modified.getTime()
          )
        }
      })
    )
    
    const filteredProjects = projectData
      .filter(Boolean)
      .filter(p => p && p.sessions.length > 0)
    
    // Processing ${filteredProjects.length} projects
    
    
    // Build a proper file tree structure
    interface FileTreeNode {
      name: string
      path: string
      type: 'folder' | 'project'
      children: FileTreeNode[]
      project?: typeof filteredProjects[0]
      sessionCount?: number
    }
    
    const root: FileTreeNode = {
      name: 'root',
      path: '',
      type: 'folder',
      children: []
    }
    
    // Process each project and build the tree
    for (const project of filteredProjects) {
      if (!project) continue
      
      let segments: string[] = []
      let cwdFound = false
      
      // Try to get the cwd from ANY session file in the project
      if (project.sessions.length > 0) {
        // Check up to 5 session files to find one with cwd
        for (let i = 0; i < Math.min(5, project.sessions.length); i++) {
          try {
            const sessionPath = path.join(claudeProjectsPath, project.name, project.sessions[i].filename)
            const content = await fs.readFile(sessionPath, 'utf-8')
            const lines = content.split('\n').filter(line => line.trim())
            
            // Check multiple lines for cwd property
            for (const line of lines.slice(0, 10)) { // Check first 10 lines
              try {
                const parsed = JSON.parse(line)
                if (parsed.cwd) {
                  // Use the cwd from the session file - all sessions in this folder belong here
                  segments = parsed.cwd.split('/').filter((s: string) => s.length > 0)
                  cwdFound = true
                  break
                }
              } catch (e) {
                // Skip malformed lines
              }
            }
            
            if (cwdFound) break // Stop checking other files once we found cwd
          } catch (e) {
            // Try next file
          }
        }
      }
      
      // Fall back to parsing the directory name if cwd wasn't found
      if (!cwdFound) {
        let projectPath = project.name
        if (projectPath.startsWith('-')) {
          projectPath = projectPath.substring(1)
        }
        
        if (projectPath.startsWith('Volumes-DevM-2-')) {
          // Handle /Volumes/DevM.2/... paths
          segments = ['Volumes', 'DevM.2']
          const rest = projectPath.substring('Volumes-DevM-2-'.length)
          if (rest) {
            // Split the rest but preserve 'projects' as a separate segment
            const restSegments = rest.split('-').filter(s => s.length > 0)
            segments.push(...restSegments)
          }
        } else if (projectPath.startsWith('Users-')) {
          // Handle /Users/... paths
          segments = projectPath.split('-').filter(s => s.length > 0)
        } else if (!projectPath || projectPath === '') {
          // Root/home directory - use actual home path
          const homePath = os.homedir()
          segments = homePath.split(path.sep).filter(s => s.length > 0)
        } else {
          // Other patterns - just split by dash
          segments = projectPath.split('-').filter(s => s.length > 0)
        }
      }
      
      // Build the tree path
      let currentNode = root
      const pathParts: string[] = []
      
      // Navigate to the folder where sessions belong
      for (const segment of segments) {
        pathParts.push(segment)
        const currentPath = '/' + pathParts.join('/')
        
        let childNode = currentNode.children.find(child => child.name === segment)
        if (!childNode) {
          childNode = {
            name: segment,
            path: currentPath,
            type: 'folder',
            children: [],
            // Initialize empty project data in case sessions are added directly to this folder
            project: undefined,
            sessionCount: 0
          }
          currentNode.children.push(childNode)
        }
        currentNode = childNode
      }
      
      // Now currentNode is the folder where these sessions belong
      // Add sessions to the folder's project data
      if (currentNode.project) {
        currentNode.project.sessions.push(...project.sessions)
        currentNode.sessionCount = (currentNode.sessionCount || 0) + project.sessions.length
      } else {
        // If project data doesn't exist, create it
        currentNode.project = {
          name: project.name,
          displayName: currentNode.name,
          sessions: project.sessions
        }
        currentNode.sessionCount = project.sessions.length
      }
    }
    
    // VSCode-style collapsing: combine single-child directories
    const collapseNodes = (node: FileTreeNode): FileTreeNode => {
      // Only collapse if:
      // 1. It's a folder
      // 2. Has exactly one child
      // 3. That child is also a folder
      // 4. The parent has NO sessions of its own
      if (node.type === 'folder' && 
          node.children.length === 1 && 
          node.children[0].type === 'folder' &&
          node.name !== 'root' &&
          (!node.project || node.project.sessions.length === 0)) {
        const onlyChild = node.children[0]
        // Recursively collapse the combined node
        return collapseNodes({
          ...node,
          name: `${node.name}/${onlyChild.name}`,
          path: onlyChild.path,
          children: onlyChild.children,
          // Preserve the child's project data if any
          project: onlyChild.project,
          sessionCount: onlyChild.sessionCount
        })
      }
      
      // Recursively collapse children
      node.children = node.children.map(child => collapseNodes(child))
      
      return node
    }
    
    // Apply collapsing
    root.children = root.children.map(child => collapseNodes(child))
    
    // Sort children at each level
    const sortTree = (node: FileTreeNode): void => {
      // Sort folders first, then by name
      node.children.sort((a, b) => {
        // Folders always come first
        if (a.type === 'folder' && b.type !== 'folder') return -1
        if (a.type !== 'folder' && b.type === 'folder') return 1
        
        // Within same type, sort alphabetically
        return a.name.localeCompare(b.name)
      })
      
      // Recursively sort children
      node.children.forEach(child => sortTree(child))
    }
    
    sortTree(root)
    
    // Sort sessions within each project
    const sortSessions = (node: FileTreeNode): void => {
      if (node.type === 'project' && node.project) {
        node.project.sessions.sort((a, b) => 
          b.modified.getTime() - a.modified.getTime()
        )
      }
      node.children.forEach(child => sortSessions(child))
    }
    
    sortSessions(root)
    
    // Calculate total session counts (sum of all nested sessions)
    const calculateTotalSessionCounts = (node: FileTreeNode): number => {
      let count = 0
      
      // Add own sessions if any
      if (node.project && node.project.sessions) {
        count += node.project.sessions.length
      }
      
      // Add all children's sessions recursively
      if (node.children) {
        for (const child of node.children) {
          count += calculateTotalSessionCounts(child)
        }
      }
      
      // Update the node's sessionCount with the total
      node.sessionCount = count
      
      return count
    }
    
    // Calculate counts for all nodes
    root.children.forEach(child => calculateTotalSessionCounts(child))
    
    return NextResponse.json({ fileTree: root.children })
  } catch (error) {
    // Error reading sessions
    return NextResponse.json({ error: 'Failed to read sessions' }, { status: 500 })
  }
}