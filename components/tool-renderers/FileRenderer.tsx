'use client';

import { useState } from 'react';
import { ToolRenderProps } from '@/lib/tool-renderers/types';
import { cn } from '@/lib/utils';
import { FileText, FolderOpen, Copy, File, Folder, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getToolStyle } from '@/lib/tool-renderers/registry';

export function FileRenderer({ invocation, result, onCopy }: ToolRenderProps) {
  const [copied, setCopied] = useState(false);
  
  const input = invocation?.input;
  const toolName = invocation?.name || '';
  const toolStyle = getToolStyle(toolName);
  const Icon = toolStyle.icon;
  
  const filePath = input?.file_path || input?.path || input?.source || '';
  const isDirectory = toolName === 'LS' || toolName.includes('directory') || toolName.includes('list');
  
  const handleCopy = () => {
    let content = '';
    if (result?.content) {
      content = typeof result.content === 'string' 
        ? result.content 
        : JSON.stringify(result.content, null, 2);
    } else {
      content = JSON.stringify(input, null, 2);
    }
    
    if (onCopy) {
      onCopy(content);
    } else {
      navigator.clipboard.writeText(content);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const truncateContent = (content: string, maxLength: number = 5000) => {
    if (content.length <= maxLength) return content;
    const lines = content.split('\n');
    const totalLines = lines.length;
    const headLines = Math.floor(maxLength * 0.8 / 100); // Take 80% from start
    const tailLines = Math.floor(maxLength * 0.2 / 100); // Take 20% from end
    
    const head = lines.slice(0, headLines).join('\n');
    const tail = lines.slice(-tailLines).join('\n');
    
    return `${head}\n\n... (${totalLines - headLines - tailLines} lines omitted) ...\n\n${tail}`;
  };

  const renderDirectoryListing = (items: any[]) => {
    return (
      <div className="space-y-1 font-mono text-xs">
        {items.map((item, index) => {
          const isDir = typeof item === 'object' && item.type === 'directory';
          const name = typeof item === 'string' ? item : item.name || item.path || '';
          
          return (
            <div key={index} className="flex items-center gap-2 py-0.5">
              {isDir ? (
                <Folder size={12} className="text-blue-600 dark:text-blue-400" />
              ) : (
                <File size={12} className="text-gray-600 dark:text-gray-400" />
              )}
              <span className={cn(
                isDir && "text-blue-600 dark:text-blue-400 font-medium"
              )}>
                {name}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {/* File Path Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon size={14} className={toolStyle.color} />
          <span className="text-sm font-medium">{toolStyle.label}</span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 px-2"
          onClick={handleCopy}
        >
          {copied ? (
            <Check size={12} className="text-green-500" />
          ) : (
            <Copy size={12} />
          )}
        </Button>
      </div>
      
      {filePath && (
        <div className="text-sm font-mono bg-muted px-2 py-1 rounded">
          {filePath}
        </div>
      )}
      
      {/* File metadata if present */}
      {input?.limit && (
        <div className="text-xs text-muted-foreground">
          Lines: {input.offset || 1} - {(input.offset || 1) + input.limit}
        </div>
      )}
      
      {/* Content display */}
      {result && !result.is_error && (
        <div className="space-y-2">
          {isDirectory && Array.isArray(result.content) ? (
            renderDirectoryListing(result.content)
          ) : (
            <pre className={cn(
              "text-xs p-3 rounded font-mono overflow-x-auto whitespace-pre-wrap",
              "bg-muted max-h-96 overflow-y-auto"
            )}>
              {typeof result.content === 'string' 
                ? truncateContent(result.content)
                : JSON.stringify(result.content, null, 2)}
            </pre>
          )}
        </div>
      )}
      
      {/* Write operation confirmation */}
      {(toolName === 'Write' || toolName === 'Create') && !result?.is_error && result && (
        <div className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
          ✓ File {toolName === 'Create' ? 'created' : 'written'} successfully
        </div>
      )}
      
      {/* Error display */}
      {result?.is_error && (
        <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 p-2 rounded">
          Error: {typeof result.content === 'string' ? result.content : 'Operation failed'}
        </div>
      )}
    </div>
  );
}