'use client';

import { useState } from 'react';
import { ToolInvocation, ToolResult } from '@/lib/tool-renderers/types';
import { getToolRenderer } from '@/lib/tool-renderers/renderer-registry';
import { getToolStyle } from '@/lib/tool-renderers/registry';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, AlertCircle, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToolDisplayProps {
  invocation?: ToolInvocation;
  result?: ToolResult;
  className?: string;
}

/**
 * Universal tool display component that renders tool calls and results.
 * 
 * Features:
 * - Specialized renderers for different tool types (bash, file operations, etc.)
 * - Fallback to generic JSON display for unknown tools
 * - Copy functionality with visual feedback
 * - Error state handling
 * - Consistent styling across all tool types
 * - Tool-specific icons and color coding
 */
export function ToolDisplay({ invocation, result, className }: ToolDisplayProps) {
  const [copied, setCopied] = useState(false);
  const toolName = invocation?.name || '';
  const toolStyle = getToolStyle(toolName);
  const SpecializedRenderer = getToolRenderer(toolName);
  
  const handleCopy = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Show checkmark for 2 seconds
    } catch (err) {
      console.error('Failed to copy:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = content;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  // Use specialized renderer if available
  if (SpecializedRenderer) {
    return (
      <Card className={cn(
        'p-4 overflow-hidden',
        toolStyle.bgColor,
        toolStyle.borderColor,
        result?.is_error && 'border-destructive',
        className
      )}>
        <SpecializedRenderer 
          invocation={invocation}
          result={result}
          onCopy={handleCopy}
        />
      </Card>
    );
  }
  
  // Fallback to generic JSON display
  const Icon = toolStyle.icon;
  
  return (
    <Card className={cn(
      'p-4 overflow-hidden',
      toolStyle.bgColor,
      toolStyle.borderColor,
      result?.is_error && 'border-destructive',
      className
    )}>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon size={14} className={toolStyle.color} />
            <span className="text-sm font-medium">
              {invocation ? `Tool: ${toolName}` : 'Tool Result'}
            </span>
            {result?.is_error && (
              <AlertCircle size={14} className="text-destructive" />
            )}
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2"
            onClick={() => {
              const content = invocation 
                ? JSON.stringify(invocation.input, null, 2)
                : typeof result?.content === 'string' 
                  ? result.content 
                  : JSON.stringify(result?.content, null, 2);
              handleCopy(content);
            }}
          >
            {copied ? (
              <Check size={12} className="text-green-500" />
            ) : (
              <Copy size={12} />
            )}
          </Button>
        </div>
        
        {/* Content */}
        <pre className="text-xs overflow-x-auto whitespace-pre-wrap bg-background/50 p-3 rounded max-h-96 overflow-y-auto font-mono break-all">
          {invocation && JSON.stringify(invocation.input, null, 2)}
          {result && (
            typeof result.content === 'string' 
              ? result.content 
              : JSON.stringify(result.content, null, 2)
          )}
        </pre>
      </div>
    </Card>
  );
}