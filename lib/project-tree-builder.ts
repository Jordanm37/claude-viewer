import { SessionThread } from '@/types/session';
import path from 'path';
import os from 'os';

/**
 * Represents a node in the file tree hierarchy for organizing Claude sessions.
 */
export interface FileTreeNode {
  name: string;
  path: string;
  type: 'folder' | 'project';
  children: FileTreeNode[];
  sessions?: Array<{
    id: string;
    title: string;
    messageCount: number;
    fileCount: number;
    lastUpdated: string;
    firstMessage: string;
    summaries?: string[];
  }>;
}

/**
 * Parses a project name into path segments for building the file tree hierarchy.
 * Handles various project naming patterns and path structures.
 */
function parseProjectPath(projectName: string, thread: SessionThread): string[] {
  // Try to get the actual cwd from a message
  const messageWithCwd = thread.messages.find(msg => msg.cwd);
  if (messageWithCwd?.cwd) {
    return messageWithCwd.cwd.split('/').filter(s => s);
  }
  
  // Fall back to parsing the directory name
  let cleanedName = projectName;
  
  // Remove leading dash
  if (cleanedName.startsWith('-')) {
    cleanedName = cleanedName.substring(1);
  }
  
  // Handle user home directory patterns
  if (cleanedName.startsWith('Users-') && cleanedName.includes('claude')) {
    const homePath = os.homedir();
    const segments = homePath.split(path.sep).filter(s => s);
    segments.push('claude');
    return segments;
  } else if (cleanedName.startsWith('Users-') && cleanedName.split('-').length === 2) {
    // Generic user home directory
    const homePath = os.homedir();
    return homePath.split(path.sep).filter(s => s);
  }
  
  // Handle Volumes paths
  if (cleanedName.startsWith('Volumes-DevM-2-')) {
    const segments = ['Volumes', 'DevM.2'];
    const rest = cleanedName.substring('Volumes-DevM-2-'.length);
    if (rest) {
      segments.push(...rest.split('-').filter(s => s));
    }
    return segments;
  }
  
  // Default: split by dash
  return cleanedName.split('-').filter(s => s);
}

/**
 * Builds a hierarchical file tree from Claude session threads.
 * 
 * Features:
 * - Groups sessions by project directory structure
 * - Collapses single-child directories (VSCode-style)
 * - Sorts folders and sessions alphabetically
 * - Handles various project path patterns
 * 
 * @param threads Array of session threads to organize
 * @returns Root node of the file tree
 */
export function buildProjectTree(threads: SessionThread[]): FileTreeNode {
  const root: FileTreeNode = {
    name: 'root',
    path: '',
    type: 'folder',
    children: []
  };
  
  // Group threads by project
  const projectThreads = new Map<string, SessionThread[]>();
  
  for (const thread of threads) {
    const projectName = thread.files[0]?.project || 'unknown';
    if (!projectThreads.has(projectName)) {
      projectThreads.set(projectName, []);
    }
    projectThreads.get(projectName)!.push(thread);
  }
  
  // Build tree for each project
  for (const [projectName, threads] of projectThreads) {
    const segments = parseProjectPath(projectName, threads[0]);
    let currentNode = root;
    
    // Navigate/create path
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      let childNode = currentNode.children.find(child => child.name === segment);
      
      if (!childNode) {
        childNode = {
          name: segment,
          path: '/' + segments.slice(0, i + 1).join('/'),
          type: 'folder',
          children: []
        };
        currentNode.children.push(childNode);
      }
      
      currentNode = childNode;
    }
    
    // Only add sessions to leaf nodes (deepest folder)
    if (!currentNode.sessions) {
      currentNode.sessions = [];
    }
    currentNode.sessions.push(...threads.map(thread => ({
      id: thread.rootSessionId,
      title: thread.title || 'Untitled Session',
      messageCount: thread.messages.length,
      fileCount: thread.files.length,
      lastUpdated: thread.messages[thread.messages.length - 1]?.timestamp || new Date().toISOString(),
      firstMessage: thread.messages[0]?.timestamp || new Date().toISOString(),
      summaries: thread.summaries.map(s => s.summary).filter(Boolean),
    })).sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()));
  }
  
  // Collapse single-child directories (VSCode style)
  function collapseNodes(node: FileTreeNode): FileTreeNode {
    if (
      node.type === 'folder' &&
      node.children.length === 1 &&
      node.children[0].type === 'folder' &&
      node.name !== 'root' &&
      !node.sessions?.length
    ) {
      const onlyChild = node.children[0];
      return collapseNodes({
        ...node,
        name: `${node.name}/${onlyChild.name}`,
        path: onlyChild.path,
        children: onlyChild.children,
        sessions: onlyChild.sessions
      });
    }
    
    node.children = node.children.map(child => collapseNodes(child));
    return node;
  }
  
  root.children = root.children.map(child => collapseNodes(child));
  
  // Sort children
  function sortTree(node: FileTreeNode): void {
    node.children.sort((a, b) => a.name.localeCompare(b.name));
    node.children.forEach(child => sortTree(child));
  }
  
  sortTree(root);
  
  return root;
}