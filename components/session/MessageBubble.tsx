'use client';

import { SessionMessage } from '@/types/session';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, User, FileCode, AlertCircle, Copy } from 'lucide-react';
import { format } from 'date-fns';
import { ToolDisplay } from '@/components/tool-renderers/ToolDisplay';
import { ToolInvocation, ToolResult } from '@/lib/tool-renderers/types';

interface MessageBubbleProps {
  message: SessionMessage;
  isFirst?: boolean;
  isLast?: boolean;
}

/**
 * Individual message component that renders user, assistant, or system messages.
 * 
 * Features:
 * - Different styling for user vs assistant messages
 * - Avatar with role-based colors (blue for user, orange for Claude)
 * - Markdown rendering with syntax highlighting
 * - Tool call and result visualization
 * - Optimized typography for readability
 * - Token usage display
 */
export function MessageBubble({ message, isFirst, isLast }: MessageBubbleProps) {
  if (message.type === 'summary') {
    return (
      <div className="flex items-center gap-2 py-2 px-4 text-sm text-muted-foreground">
        <div className="h-px flex-1 bg-border" />
        <span className="italic">{message.summary}</span>
        <div className="h-px flex-1 bg-border" />
      </div>
    );
  }

  const isUser = message.type === 'user';
  const isSystem = message.type === 'system';
  const isAttachment = message.type === 'attachment';
  
  const messageContent = message.message?.content;
  const textContent = typeof messageContent === 'string' 
    ? messageContent 
    : messageContent?.find(c => c.type === 'text')?.text || '';
  
  const toolCalls = typeof messageContent === 'object' && Array.isArray(messageContent)
    ? messageContent.filter(c => c.type === 'tool_use')
    : [];
    
  const toolResults = typeof messageContent === 'object' && Array.isArray(messageContent)
    ? messageContent.filter(c => c.type === 'tool_result')
    : [];
  
  // Extract tool names for data attributes
  const toolNames = toolCalls.map((tool: any) => tool.name).filter(Boolean);
  const hasToolCalls = toolCalls.length > 0;
  const hasToolResults = toolResults.length > 0;

  return (
    <div 
      data-message-id={message.uuid}
      data-has-tool-calls={hasToolCalls}
      data-has-tool-results={hasToolResults}
      data-tool-names={toolNames.join(',')}
      data-message-type={message.type}
      className={cn(
        "message group relative flex gap-space-2 px-space-3 md:px-space-4 py-space-3",
        "border-b border-border/10",
        isFirst && "pt-space-4",
        isLast && "pb-space-4 border-b-0",
        // Add subtle background differentiation
        isUser && "bg-background/50",
        !isUser && !isSystem && "bg-muted/5"
      )}>
      {/* Avatar */}
      <div className={cn(
        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
        isUser 
          ? "bg-premium-accent-blue/10 text-premium-accent-blue" 
          : "bg-premium-accent-orange/10 text-premium-accent-orange"
      )}>
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>

      {/* Content - no message bubbles */}
      <div className="overflow-hidden min-w-0 space-y-2 flex-1">
        <div className="flex items-baseline gap-2">
          <span className={cn(
            "font-semibold text-sm",
            isUser ? "text-premium-accent-blue" : "text-premium-accent-orange"
          )}>
            {isUser ? 'You' : isSystem ? 'System' : 'Claude'}
          </span>
          <span className="text-xs text-premium-text-tertiary">
            {format(new Date(message.timestamp), 'h:mm a')}
          </span>
          {message.message?.model && (
            <span className="text-xs text-premium-text-tertiary">
              • {message.message.model}
            </span>
          )}
        </div>

        {/* Main text content with optimized typography */}
        {textContent && (
            <div className={cn(
              "prose dark:prose-invert max-w-none overflow-hidden",
              "[&>*]:text-[0.9375rem] [&>*]:leading-[1.65]", // 15px, 1.65 line height
              "prose-p:my-3 max-w-[65ch]", // Optimal line length
              "prose-headings:font-[500] prose-headings:tracking-[-0.02em]",
              "prose-code:text-[0.875rem] prose-code:bg-black/5 dark:prose-code:bg-white/5",
              "prose-code:px-1 prose-code:py-0.5 prose-code:rounded-none",
              "prose-code:before:content-[''] prose-code:after:content-['']",
              "prose-pre:bg-transparent prose-pre:p-0 prose-pre:m-0",
              // Typography differentiation
              isUser 
                ? "font-weight-[450] tracking-[-0.01em]" // Slightly bolder for user
                : "font-weight-[400] tracking-[-0.005em] text-muted-foreground/85" // Muted for assistant
            )}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {textContent}
              </ReactMarkdown>
            </div>
          )}

        {/* Tool calls */}
        {toolCalls.length > 0 && (
          <div className="space-y-2 mt-4">
            {toolCalls.map((tool, index) => (
              <ToolDisplay 
                key={index} 
                invocation={tool as ToolInvocation}
              />
            ))}
          </div>
        )}

        {/* Tool results */}
        {toolResults.length > 0 && (
          <div className="space-y-2 mt-4">
            {toolResults.map((result, index) => (
              <ToolDisplay 
                key={index} 
                result={result as ToolResult}
              />
            ))}
          </div>
        )}

        {/* Token usage */}
        {message.message?.usage && (
          <div className="flex gap-4 text-xs text-muted-foreground mt-2">
            <span>Input: {message.message.usage.input_tokens.toLocaleString()} tokens</span>
            <span>Output: {message.message.usage.output_tokens.toLocaleString()} tokens</span>
          </div>
        )}
      </div>
    </div>
  );
}