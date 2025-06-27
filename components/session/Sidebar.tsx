'use client';

import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useStore } from '@/lib/store';
import {
  Sidebar as SidebarPrimitive,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  Search, 
  ChevronRight,
  MessageSquare, 
  Star,
  StarOff,
  Folder,
  Calendar,
  Hash,
  FileText
} from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import Fuse from 'fuse.js';
import { FileTreeNode } from '@/lib/project-tree-builder';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

/**
 * Main sidebar component for browsing Claude sessions organized in a file tree.
 * 
 * Features:
 * - Hierarchical project/folder structure
 * - Search functionality with fuzzy matching
 * - Bookmarking system for favorite sessions
 * - Keyboard navigation (arrow keys)
 * - Auto-expand to show active session
 * - Collapsible folders with session counts
 * - Real-time session metadata (message count, last updated)
 */
export function Sidebar() {
  const { 
    activeSessionId, 
    setActiveSessionId, 
    searchQuery, 
    setSearchQuery,
    bookmarks,
    addBookmark,
    removeBookmark 
  } = useStore();
  
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  
  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const sessions = document.querySelectorAll('[role="button"][data-session-id]');
        const currentIndex = Array.from(sessions).findIndex(s => s.getAttribute('data-session-id') === activeSessionId);
        
        if (e.key === 'ArrowDown' && currentIndex < sessions.length - 1) {
          const nextSession = sessions[currentIndex + 1] as HTMLElement;
          nextSession.click();
          nextSession.focus();
        } else if (e.key === 'ArrowUp' && currentIndex > 0) {
          const prevSession = sessions[currentIndex - 1] as HTMLElement;
          prevSession.click();
          prevSession.focus();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSessionId]);
  
  // Fetch sessions with tree structure
  const { data, isLoading } = useQuery({
    queryKey: ['sessions-v3'],
    queryFn: async () => {
      const response = await fetch('/api/sessions/v3');
      if (!response.ok) throw new Error('Failed to fetch sessions');
      return response.json();
    },
    refetchInterval: 30000,
  });
  
  const fileTree = data?.fileTree || [];
  
  // Auto-expand folders containing the active session
  useEffect(() => {
    if (!activeSessionId || !fileTree.length) return;
    
    // Find the path to the active session
    const findSessionPath = (nodes: FileTreeNode[], path: string[] = []): string[] | null => {
      for (const node of nodes) {
        const currentPath = [...path, node.path];
        
        // Check if this node has the active session
        if (node.sessions?.some(s => s.id === activeSessionId)) {
          return currentPath;
        }
        
        // Recursively check children
        if (node.children.length > 0) {
          const childPath = findSessionPath(node.children, currentPath);
          if (childPath) return childPath;
        }
      }
      return null;
    };
    
    const pathToExpand = findSessionPath(fileTree);
    if (pathToExpand) {
      setExpandedFolders(new Set(pathToExpand));
    }
  }, [activeSessionId, fileTree]);
  
  // Toggle folder expansion
  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };
  
  // Get total filtered count
  const getTotalFilteredCount = (tree: FileTreeNode[]): number => {
    let count = 0;
    
    const countNode = (node: FileTreeNode) => {
      const validSessions = filterValidSessions(filterSessions(node.sessions || []));
      count += validSessions.length;
      
      node.children.forEach(child => countNode(child));
    };
    
    tree.forEach(node => countNode(node));
    return count;
  };
  
  // Format date helper
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM d');
  };
  
  // Check if session is bookmarked
  const isBookmarked = (sessionId: string) => 
    bookmarks.some(b => b.sessionId === sessionId);
  
  // Get total session count for a node
  const getTotalSessionCount = (node: FileTreeNode): number => {
    let count = node.sessions?.length || 0;
    node.children.forEach(child => {
      count += getTotalSessionCount(child);
    });
    return count;
  };
  
  // Filter sessions by search
  const filterSessions = (sessions: any[]) => {
    if (!searchQuery.trim()) return sessions;
    
    const fuse = new Fuse(sessions, {
      keys: ['title'],
      threshold: 0.3,
    });
    return fuse.search(searchQuery).map(result => result.item);
  };
  
  // Filter out sessions with 0 messages
  const filterValidSessions = (sessions: any[]) => {
    return sessions.filter(session => session.messageCount > 0);
  };
  
  // Render tree node
  const renderNode = (node: FileTreeNode, depth: number = 0) => {
    const isExpanded = expandedFolders.has(node.path);
    const hasChildren = node.children.length > 0;
    const validSessions = filterValidSessions(filterSessions(node.sessions || []));
    const hasSessions = validSessions.length > 0;
    
    // Skip if no content
    if (!hasChildren && !hasSessions) return null;
    
    return (
      <Collapsible
        key={node.path}
        open={isExpanded}
        onOpenChange={() => toggleFolder(node.path)}
      >
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton className="w-full h-auto p-space-2 rounded-premium hover:bg-premium-bg-secondary hover:translate-x-0.5 hover:shadow-sm transition-premium">
              <span className={cn("text-sm", isExpanded ? "●" : "○")}>
                {isExpanded ? "●" : "○"}
              </span>
              <span className="flex-1 text-left break-words whitespace-normal font-medium">{node.name}</span>
              {(hasSessions || hasChildren) && (
                <Badge variant="secondary" className="h-5 px-1.5 text-xs bg-premium-bg-secondary">
                  {getTotalSessionCount(node)}
                </Badge>
              )}
              <ChevronRight className={cn(
                "h-4 w-4 transition-transform opacity-60",
                isExpanded && "rotate-90"
              )} />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              {/* Render child folders */}
              {node.children.map(child => (
                <div key={child.path}>
                  {renderNode(child, depth + 1)}
                </div>
              ))}
              
              {/* Render sessions */}
              {validSessions.map((session) => (
                <SidebarMenuSubItem key={session.id}>
                  <SidebarMenuSubButton
                    onClick={() => setActiveSessionId(session.id)}
                    className={cn(
                      "group relative w-full p-space-2 rounded-premium transition-premium cursor-pointer",
                      "hover:bg-premium-bg-secondary hover:translate-x-0.5 hover:shadow-sm",
                      activeSessionId === session.id && "font-medium"
                    )}
                    data-session-id={session.id}
                  >
                    <span className={cn(
                      "text-sm flex-shrink-0",
                      activeSessionId === session.id ? "text-premium-accent-blue" : ""
                    )}>◐</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm break-words whitespace-normal">
                        {session.title}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{session.messageCount} msgs</span>
                        {session.fileCount > 1 && (
                          <>
                            <span>•</span>
                            <span>{session.fileCount} files</span>
                          </>
                        )}
                        <span>•</span>
                        <span>{formatDate(session.lastUpdated)}</span>
                      </div>
                    </div>
                    
                    {/* Bookmark button */}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isBookmarked(session.id)) {
                          removeBookmark(session.id);
                        } else {
                          addBookmark({
                            sessionId: session.id,
                            title: session.title,
                            timestamp: new Date().toISOString(),
                          });
                        }
                      }}
                    >
                      <span className="text-sm">
                        {isBookmarked(session.id) ? "★" : "☆"}
                      </span>
                    </Button>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    );
  };

  return (
    <SidebarPrimitive className="w-[320px]" collapsible="none">
      <SidebarHeader>
        <h2 className="text-lg font-semibold px-2">Claude Sessions</h2>
        <div className="px-2 mt-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search sessions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8"
            />
          </div>
          {searchQuery && (
            <p className="text-xs text-muted-foreground px-2 py-1">
              {getTotalFilteredCount(fileTree)} results
            </p>
          )}
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <ScrollArea className="flex-1">
          {/* Bookmarked Sessions */}
          {bookmarks.length > 0 && (
            <SidebarGroup>
              <SidebarGroupLabel>
                <Star className="h-4 w-4 mr-1" />
                Bookmarks
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {bookmarks.map((bookmark) => (
                    <SidebarMenuItem key={bookmark.sessionId}>
                      <SidebarMenuButton
                        onClick={() => setActiveSessionId(bookmark.sessionId)}
                        className={cn(
                          "h-auto py-2",
                          activeSessionId === bookmark.sessionId && "bg-accent"
                        )}
                      >
                        <MessageSquare className="h-4 w-4 flex-shrink-0" />
                        <span className="break-words whitespace-normal">{bookmark.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
          
          {/* All Sessions */}
          <SidebarGroup>
            <SidebarGroupLabel>
              <Folder className="h-4 w-4 mr-1" />
              All Sessions
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Loading sessions...
                  </div>
                ) : fileTree.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No sessions found
                  </div>
                ) : (
                  fileTree.map(node => renderNode(node))
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </ScrollArea>
      </SidebarContent>
      
      <SidebarFooter>
        <div className="px-2 py-2 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>{fileTree.length} projects</span>
            <span>{data?.totalSessions || 0} sessions</span>
          </div>
        </div>
      </SidebarFooter>
    </SidebarPrimitive>
  );
}