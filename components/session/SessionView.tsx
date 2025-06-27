'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useStore } from '@/lib/store';
import { SimpleMessageList } from './SimpleMessageList';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Download, 
  Copy, 
  Check,
  ExternalLink,
  FileText,
  Clock,
  MessageSquare,
  Activity,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { SessionThread } from '@/types/session';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Skeleton } from '@/components/ui/skeleton';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

/**
 * Main session viewing component that displays conversation details and messages.
 * 
 * Features:
 * - Session header with title, metadata, and actions
 * - Empty state with suggestions when no session is selected
 * - Loading states with shimmer animations
 * - Live updates when Claude is active
 * - Copy session ID with visual feedback
 * - Export to markdown functionality
 * - Real-time message count and activity indicators
 */
export function SessionView() {
  const activeSessionId = useStore((state) => state.activeSessionId);
  const isClaudeActive = useStore((state) => state.isClaudeActive);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();
  
  // Fetch session thread
  const { data: thread, isLoading, error } = useQuery<SessionThread>({
    queryKey: ['session', activeSessionId],
    queryFn: async () => {
      if (!activeSessionId) throw new Error('No session selected');
      const response = await fetch(`/api/sessions/thread/${activeSessionId}`);
      if (!response.ok) throw new Error('Failed to fetch session');
      return response.json();
    },
    enabled: !!activeSessionId,
    staleTime: 0, // Always consider data stale for real-time updates
    refetchInterval: isClaudeActive ? 5000 : false, // Poll every 5s when Claude is active
    refetchIntervalInBackground: true, // Continue polling in background
  });
  
  // Track new messages for visual feedback
  useEffect(() => {
    if (thread && thread.messages.length > 0) {
      setHasNewMessages(true);
      const timeout = setTimeout(() => setHasNewMessages(false), 2000);
      return () => clearTimeout(timeout);
    }
  }, [thread?.messages.length]);
  
  if (!activeSessionId) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-premium-bg-primary w-full">
        <div className="flex justify-end p-space-3">
          <ThemeToggle />
        </div>
        <div className="flex-1 flex flex-col justify-center w-full">
          <div className="space-y-space-3 p-space-4 animate-fade-in text-center">
            {/* Neural network icon placeholder */}
            <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-premium-accent-purple/20 to-premium-accent-blue/20 flex items-center justify-center">
              <div className="space-y-1">
                <div className="flex justify-center gap-1">
                  <span className="w-2 h-2 bg-premium-accent-purple rounded-full animate-pulse" />
                  <span className="w-2 h-2 bg-premium-accent-blue rounded-full animate-pulse delay-75" />
                  <span className="w-2 h-2 bg-premium-accent-purple rounded-full animate-pulse delay-150" />
                </div>
                <div className="flex justify-center gap-1">
                  <span className="w-2 h-2 bg-premium-accent-blue rounded-full animate-pulse delay-100" />
                  <span className="w-2 h-2 bg-premium-accent-purple rounded-full animate-pulse delay-200" />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-2xl font-display font-medium text-premium-text-primary">
                No conversation selected
              </h3>
              <p className="text-premium-text-secondary max-w-sm mx-auto">
                Choose a session from the sidebar to begin
              </p>
            </div>
            
            {/* Suggestions */}
            <div className="flex flex-wrap justify-center gap-2 mt-space-4">
              <button className="group flex items-center gap-2 px-space-2 py-space-1 bg-premium-bg-secondary hover:bg-premium-bg-tertiary rounded-premium transition-premium">
                <span className="text-xs opacity-60">⌘</span>
                <span className="text-sm text-premium-text-secondary group-hover:text-premium-text-primary">
                  Use ⌘K to search
                </span>
              </button>
              <button className="group flex items-center gap-2 px-space-2 py-space-1 bg-premium-bg-secondary hover:bg-premium-bg-tertiary rounded-premium transition-premium">
                <span className="text-xs">★</span>
                <span className="text-sm text-premium-text-secondary group-hover:text-premium-text-primary">
                  View starred
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center text-destructive">
        <div className="text-center">
          <p className="text-lg">Error loading session</p>
          <p className="text-sm mt-2">{error.message}</p>
        </div>
      </div>
    );
  }
  
  // Loading state for session changes
  if (isLoading && activeSessionId) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-premium-bg-primary">
        <div className="border-b border-border/50 px-space-4 py-space-3 flex-shrink-0">
          <div className="h-7 w-1/3 mb-2 rounded-md shimmer" />
          <div className="h-4 w-1/2 rounded-md shimmer" />
        </div>
        <div className="flex-1 p-space-4 space-y-space-2">
          <div className="h-20 w-full rounded-premium shimmer" />
          <div className="h-20 w-full rounded-premium shimmer animate-delay-75" />
          <div className="h-20 w-full rounded-premium shimmer animate-delay-150" />
        </div>
      </div>
    );
  }
  
  // Copy session ID to clipboard
  const copySessionId = async () => {
    if (!activeSessionId) return;
    
    try {
      await navigator.clipboard.writeText(activeSessionId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy session ID:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = activeSessionId;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  // Export to markdown
  const exportToMarkdown = () => {
    if (!thread) return;
    
    let markdown = `# ${thread.title || 'Claude Conversation'}\n\n`;
    markdown += `**Session ID:** ${thread.rootSessionId}\n`;
    markdown += `**Date:** ${format(new Date(thread.messages[0]?.timestamp || Date.now()), 'PPP')}\n`;
    markdown += `**Messages:** ${thread.messages.length}\n\n---\n\n`;
    
    for (const message of thread.messages) {
      if (message.type === 'summary') continue;
      
      const role = message.type === 'user' ? 'You' : 'Claude';
      const time = format(new Date(message.timestamp), 'h:mm a');
      
      markdown += `## ${role} (${time})\n\n`;
      
      const content = message.message?.content;
      if (typeof content === 'string') {
        markdown += content + '\n\n';
      } else if (Array.isArray(content)) {
        for (const item of content) {
          if (item.type === 'text') {
            markdown += item.text + '\n\n';
          }
        }
      }
      
      if (message.message?.usage) {
        markdown += `*Tokens: ${message.message.usage.input_tokens} in, ${message.message.usage.output_tokens} out*\n\n`;
      }
      
      markdown += '---\n\n';
    }
    
    // Download the file
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `claude-session-${activeSessionId}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden max-w-full">
      {/* Header */}
      <div className="border-b px-8 py-5 flex-shrink-0 max-w-full overflow-hidden bg-background/95 backdrop-blur-sm">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-semibold line-clamp-1">
              {thread?.title || 'Loading...'}
            </h2>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <MessageSquare size={14} />
                {thread?.messages.length || 0} messages
              </span>
              <span className="flex items-center gap-1">
                <FileText size={14} />
                {thread?.files.length || 0} files
              </span>
              {thread?.messages[0] && (
                <span className="flex items-center gap-1">
                  <Clock size={14} />
                  {format(new Date(thread.messages[0].timestamp), 'PPP')}
                </span>
              )}
              {isClaudeActive && (
                <span className={cn(
                  "flex items-center gap-1 transition-colors duration-300",
                  hasNewMessages ? "text-green-500 animate-pulse" : "text-green-500"
                )}>
                  <Activity size={14} className={hasNewMessages ? "animate-spin" : "animate-pulse"} />
                  {hasNewMessages ? "New message!" : "Claude active"}
                </span>
              )}
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="outline"
              size="sm"
              onClick={() => queryClient.refetchQueries({ queryKey: ['session', activeSessionId] })}
              disabled={isLoading}
              title="Refresh messages"
            >
              <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={copySessionId}
              title="Copy session ID"
            >
              {copied ? (
                <Check size={14} className="text-green-500" />
              ) : (
                <Copy size={14} />
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportToMarkdown}
              disabled={!thread}
              title="Export to Markdown"
            >
              <Download size={14} />
            </Button>
          </div>
        </div>
        
        {/* Summary pills - temporarily disabled due to overflow issue */}
      </div>
      
      <Separator />
      
      {/* Messages */}
      <SimpleMessageList
        messages={thread?.messages || []}
        isLoading={isLoading}
        autoScroll={true}
      />
    </div>
  );
}