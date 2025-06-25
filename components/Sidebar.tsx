import { ChevronRight, MessageSquare, Folder, FolderOpen, Copy, Check, Moon, Sun } from 'lucide-react'
import { useState, useEffect } from 'react'
import type { FileTreeNode } from '@/app/page'

/**
 * Props for the Sidebar component
 */
type SidebarProps = {
  fileTree: FileTreeNode[]             // File tree structure
  selectedProject: string | null       // Currently selected project name
  selectedSession: string | null       // Currently selected session ID
  onSelectSession: (projectName: string, sessionId: string) => void  // Callback for session selection
  loading: boolean                     // Whether project data is still loading
}

/**
 * TreeItem Component
 * 
 * Renders a single node in the file tree (folder or project)
 * Handles its own expand/collapse state and renders children recursively
 */
function TreeItem({ 
  node, 
  depth = 0,
  selectedProject,
  selectedSession,
  onSelectSession,
  expandedFolders
}: {
  node: FileTreeNode
  depth?: number
  selectedProject: string | null
  selectedSession: string | null
  onSelectSession: (projectName: string, sessionId: string) => void
  expandedFolders?: Set<string>
}) {
  // Auto-expand if this folder has only one child AND no sessions of its own
  // OR if it's in the expandedFolders set (for URL navigation)
  const shouldAutoExpand = (node.type === 'folder' && 
    node.children && 
    node.children.length === 1 && 
    (!node.project || node.project.sessions.length === 0)) ||
    (expandedFolders?.has(node.path) ?? false)
    
  const [isExpanded, setIsExpanded] = useState(shouldAutoExpand)
  
  // Update expansion state when expandedFolders changes
  useEffect(() => {
    if (expandedFolders?.has(node.path)) {
      // Expanding folder: node.path
      setIsExpanded(true)
    }
  }, [expandedFolders, node.path])
  // Removed expandedSessions - not used
  const [copiedSession, setCopiedSession] = useState<string | null>(null)
  // Removed expandedTitles - not used

  const toggleExpanded = () => setIsExpanded(!isExpanded)
  
  // Removed toggleTitleExpanded - not used

  /**
   * Formats a date string for display in the session list
   * @param dateString - ISO date string to format
   * @returns Formatted date and time string
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  /**
   * Copies the full file path of a session to the clipboard
   * @param projectName - The project containing the session
   * @param sessionId - The session ID
   * @param e - Mouse event to prevent propagation
   */
  const copyToClipboard = async (projectName: string, sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering the session selection
    
    // Construct the path relative to home directory
    // Users will need to replace ~ with their home directory
    const path = `~/.claude/projects/${projectName}/${sessionId}.jsonl`
    
    try {
      await navigator.clipboard.writeText(path)
      setCopiedSession(sessionId)
      // Show checkmark for 2 seconds as feedback
      setTimeout(() => setCopiedSession(null), 2000)
    } catch (err) {
      // Failed to copy to clipboard
    }
  }

  // Modern indentation with tree lines
  const indentWidth = depth * 20 // More generous spacing
  const showTreeLine = depth > 0
  
  // Calculate these outside the if statement
  const hasOwnSessions = node.project && node.project.sessions && node.project.sessions.length > 0
  const hasChildren = node.children && node.children.length > 0

  if (node.type === 'folder') {
    return (
      <div className="relative">
        {/* Tree line for this folder is handled by parent container */}
        
        <button
          onClick={toggleExpanded}
          className="w-full relative flex items-center gap-2 py-2 px-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 group rounded-md"
          style={{ paddingLeft: `${indentWidth + 8}px` }}
        >
          {/* Expand/collapse chevron */}
          <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
            {hasChildren || hasOwnSessions ? (
              <ChevronRight 
                className={`w-3.5 h-3.5 text-gray-400 transition-transform ${
                  isExpanded ? 'rotate-90' : ''
                }`} 
              />
            ) : (
              <div className="w-3.5" /> // Spacer for alignment
            )}
          </div>
          
          {/* Folder icon */}
          {isExpanded ? (
            <FolderOpen className="w-4 h-4 text-blue-500 dark:text-blue-400 flex-shrink-0" />
          ) : (
            <Folder className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400 flex-shrink-0" />
          )}
          
          {/* Folder name */}
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
            {node.name}
          </span>
          
          {/* Session count badge - show total of all nested sessions */}
          {node.sessionCount && node.sessionCount > 0 && (
            <span className="ml-auto text-xs text-gray-500 dark:text-gray-400 px-2 py-0.5 bg-gray-100 dark:bg-gray-800/50 rounded-full font-medium">
              {node.sessionCount}
            </span>
          )}
        </button>
        
        {isExpanded && (
          <div className="relative"
               style={{ 
                 marginLeft: depth > 0 ? `${depth * 20 + 10}px` : '0',
                 borderLeft: '2px solid rgba(156, 163, 175, 0.5)'
               }}>
            
            {/* Show child folders/projects first */}
            {hasChildren && node.children.map((child, idx) => (
              <TreeItem
                key={`${child.path}-${idx}`}
                node={child}
                depth={depth + 1}
                selectedProject={selectedProject}
                selectedSession={selectedSession}
                onSelectSession={onSelectSession}
                expandedFolders={expandedFolders}
              />
            ))}
            
            {/* Then show own sessions if any */}
            {hasOwnSessions && node.project && (
              <div className="relative">
                {node.project.sessions.map((session) => {
                  const isSelected = selectedProject === node.project!.name && selectedSession === session.id
                  const sessionIndent = (depth + 1) * 20
                  
                  return (
                    <div key={session.id} className="relative">
                      
                      {/* Horizontal connector line */}
                      {showTreeLine && (
                        <div 
                          className="absolute top-5 border-t-2 border-gray-200 dark:border-gray-700 opacity-50"
                          style={{ 
                            left: `${sessionIndent - 10}px`,
                            width: '18px'
                          }}
                        />
                      )}
                      
                      <div
                        onClick={() => onSelectSession(node.project!.name, session.id)}
                        data-session-id={session.id}
                        className={`relative flex items-start gap-2 py-2 px-3 text-sm transition-all duration-200 group rounded-md cursor-pointer ${
                          isSelected
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                        style={{ 
                          marginLeft: `${sessionIndent + 8}px`,
                          width: `calc(100% - ${sessionIndent + 8}px)`
                        }}
                      >
                      <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 transition-colors ${
                        isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p 
                          className={`text-sm text-left leading-relaxed break-words ${
                            isSelected ? 'text-blue-700 dark:text-blue-300 font-medium' : 'text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {session.title}
                        </p>
                        <span className={`text-xs text-left mt-0.5 block ${
                          isSelected ? 'text-blue-600/70 dark:text-blue-400/70' : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {formatDate(session.modified)}
                        </span>
                      </div>
                      {isSelected && (
                        <button
                          onClick={(e) => copyToClipboard(node.project!.name, session.id, e)}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-all opacity-0 group-hover:opacity-100"
                          title="Copy JSONL file path"
                        >
                          {copiedSession === session.id ? (
                            <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                          ) : (
                            <Copy className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                          )}
                        </button>
                      )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // Project node (for nodes that are projects but not folders)
  if (node.type === 'project' && node.project) {
    const project = node.project
    const shouldExpandProject = expandedFolders?.has(node.path) ?? false
    const [isProjectExpanded, setIsProjectExpanded] = useState(shouldExpandProject)

    return (
      <div className="relative">
        {/* Tree line for this project is handled by parent container */}
        
        <button
          onClick={() => setIsProjectExpanded(!isProjectExpanded)}
          className="w-full relative flex items-center gap-2 py-2 px-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 group rounded-md"
          style={{ paddingLeft: `${indentWidth + 8}px` }}
        >
          {/* Expand/collapse chevron */}
          <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
            <ChevronRight 
              className={`w-3.5 h-3.5 text-gray-400 transition-transform ${
                isProjectExpanded ? 'rotate-90' : ''
              }`} 
            />
          </div>
          
          {/* Folder icon */}
          {isProjectExpanded ? (
            <FolderOpen className="w-4 h-4 text-blue-500 dark:text-blue-400 flex-shrink-0" />
          ) : (
            <Folder className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400 flex-shrink-0" />
          )}
          
          <span className="text-sm font-medium truncate text-gray-700 dark:text-gray-200">
            {node.name}
          </span>
          
          <span className="ml-auto text-xs text-gray-500 dark:text-gray-400 px-2 py-0.5 bg-gray-100 dark:bg-gray-800/50 rounded-full font-medium">
            {node.sessionCount}
          </span>
        </button>
        
        {isProjectExpanded && (
          <div className="relative"
               style={{ 
                 marginLeft: depth > 0 ? `${depth * 20 + 10}px` : '0',
                 borderLeft: '2px solid rgba(156, 163, 175, 0.5)'
               }}>
            
            {project.sessions.map((session) => {
              const isSelected = selectedProject === project.name && selectedSession === session.id
              const sessionIndent = (depth + 1) * 20
              
              return (
                <div key={session.id} className="relative">
                  
                  {/* Horizontal connector line */}
                  {showTreeLine && (
                    <div 
                      className="absolute top-5 border-t-2 border-gray-200 dark:border-gray-700 opacity-50"
                      style={{ 
                        left: `${sessionIndent - 10}px`,
                        width: '18px'
                      }}
                    />
                  )}
                  
                  <div
                    onClick={() => onSelectSession(project.name, session.id)}
                    data-session-id={session.id}
                    className={`relative flex items-start gap-2 py-2 px-3 text-sm transition-all duration-200 group rounded-md cursor-pointer ${
                      isSelected
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                    style={{ 
                      marginLeft: `${sessionIndent + 8}px`,
                      width: `calc(100% - ${sessionIndent + 8}px)`
                    }}
                  >
                    <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 transition-colors ${
                      isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p 
                        className={`text-sm text-left leading-relaxed break-words ${
                          isSelected ? 'text-blue-700 dark:text-blue-300 font-medium' : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {session.title}
                      </p>
                      <span className={`text-xs text-left mt-0.5 block ${
                        isSelected ? 'text-blue-600/70 dark:text-blue-400/70' : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {formatDate(session.modified)}
                      </span>
                    </div>
                    {isSelected && (
                      <button
                        onClick={(e) => copyToClipboard(project.name, session.id, e)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-all opacity-0 group-hover:opacity-100"
                        title="Copy JSONL file path"
                      >
                        {copiedSession === session.id ? (
                          <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                        ) : (
                          <Copy className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return null
}

/**
 * Sidebar Component
 * 
 * Displays a file tree navigation for browsing Claude conversation sessions.
 * Sessions are organized in a hierarchical folder structure based on their
 * actual working directories.
 * 
 * Features:
 * - Proper file tree with expandable folders
 * - VSCode-style collapsed paths
 * - Session count badges
 * - Copy-to-clipboard for JSONL file paths
 * - Visual feedback for selected session
 * - Loading state with skeleton UI
 * 
 * @param props - Component props
 * @returns React component displaying the file tree
 */
export default function Sidebar({
  fileTree,
  selectedProject,
  selectedSession,
  onSelectSession,
  loading
}: SidebarProps) {
  // Initialize theme state from current DOM
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark')
    }
    return true
  })
  
  // Toggle theme
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])
  
  // Track expansion state for auto-expand
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  
  // Auto-expand to selected session when loading from URL
  useEffect(() => {
    if (selectedSession && fileTree.length > 0) {
      // Find which folders need to be expanded
      const foldersToExpand = new Set<string>()
      
      const findSessionPath = (nodes: FileTreeNode[], path: string[] = []): boolean => {
        for (const node of nodes) {
          const currentPath = [...path, node.path]
          
          // Check if this node has the session
          if (node.project?.sessions.some(s => s.id === selectedSession)) {
            // Found session in node
            // Full path to expand
            // Add all parent paths to expand
            currentPath.forEach(p => foldersToExpand.add(p))
            return true
          }
          
          // Check children
          if (node.children && findSessionPath(node.children, currentPath)) {
            return true
          }
        }
        return false
      }
      
      findSessionPath(fileTree)
      
      if (foldersToExpand.size > 0) {
        // Auto-expanding folders
        setExpandedFolders(foldersToExpand)
        
        // Scroll to session after React renders the expanded folders
        setTimeout(() => {
          const sessionElement = document.querySelector(`[data-session-id="${selectedSession}"]`)
          if (sessionElement) {
            sessionElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }, 300)
      }
    }
  }, [selectedSession, fileTree])
  // Track if we should auto-expand to show selected session (from URL)
  const [hasAutoExpanded, setHasAutoExpanded] = useState(false)
  
  // Mark as auto-expanded once we've done it
  useEffect(() => {
    if (selectedSession && !hasAutoExpanded) {
      setHasAutoExpanded(true)
    }
  }, [selectedSession, hasAutoExpanded])
  // Show skeleton loading UI while fetching project data
  if (loading) {
    return (
      <div className="w-80 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-md mb-6"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
                <div className="w-8 h-4 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-80 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 overflow-y-auto flex flex-col">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Claude Sessions</h1>
        <button
          onClick={() => setIsDark(!isDark)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? (
            <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          ) : (
            <Moon className="w-5 h-5 text-gray-600" />
          )}
        </button>
      </div>
      
      <div className="flex-1 p-4">
        <div className="space-y-0.5">
          {fileTree.map((node, idx) => (
            <TreeItem
              key={`${node.path}-${idx}`}
              node={node}
              selectedProject={selectedProject}
              selectedSession={selectedSession}
              onSelectSession={onSelectSession}
              expandedFolders={expandedFolders}
            />
          ))}
        </div>
      </div>
    </div>
  )
}