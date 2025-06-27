'use client';

import { useState } from 'react';
import { ToolRenderProps } from '@/lib/tool-renderers/types';
import { cn } from '@/lib/utils';
import { Terminal, Copy, AlertCircle, CheckCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CodeRenderer({ invocation, result, onCopy }: ToolRenderProps) {
  const [copiedCommand, setCopiedCommand] = useState(false);
  const [copiedOutput, setCopiedOutput] = useState(false);
  
  const input = invocation?.input;
  const command = input?.command || input?.script || input?.code || '';
  const description = input?.description || '';
  
  const handleCopyCommand = () => {
    if (onCopy) {
      onCopy(command);
    } else {
      navigator.clipboard.writeText(command);
    }
    setCopiedCommand(true);
    setTimeout(() => setCopiedCommand(false), 2000);
  };
  
  const handleCopyOutput = () => {
    const output = typeof result?.content === 'string' 
      ? result.content 
      : JSON.stringify(result?.content, null, 2);
    if (onCopy) {
      onCopy(output);
    } else {
      navigator.clipboard.writeText(output);
    }
    setCopiedOutput(true);
    setTimeout(() => setCopiedOutput(false), 2000);
  };

  const truncateOutput = (output: string, maxLength: number = 10000) => {
    if (output.length <= maxLength) return output;
    return output.substring(0, maxLength) + '\n\n... (truncated)';
  };

  return (
    <div className="space-y-3">
      {/* Command Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal size={14} className="text-slate-600 dark:text-slate-400" />
            <span className="text-sm font-medium">Command</span>
            {description && (
              <span className="text-xs text-muted-foreground">• {description}</span>
            )}
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2"
            onClick={handleCopyCommand}
          >
            {copiedCommand ? (
              <Check size={12} className="text-green-500" />
            ) : (
              <Copy size={12} />
            )}
          </Button>
        </div>
        
        <pre className={cn(
          "text-xs p-3 rounded font-mono overflow-x-auto whitespace-pre-wrap",
          "bg-slate-950 text-slate-100 dark:bg-slate-900"
        )}>
          <span className="text-slate-400">$ </span>
          {command}
        </pre>
      </div>
      
      {/* Output Section */}
      {result && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {result.is_error ? (
                <>
                  <AlertCircle size={14} className="text-red-600 dark:text-red-400" />
                  <span className="text-sm font-medium text-red-600 dark:text-red-400">
                    Error Output
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle size={14} className="text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium">Output</span>
                </>
              )}
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2"
              onClick={handleCopyOutput}
            >
              {copiedOutput ? (
                <Check size={12} className="text-green-500" />
              ) : (
                <Copy size={12} />
              )}
            </Button>
          </div>
          
          <pre className={cn(
            "text-xs p-3 rounded font-mono overflow-x-auto whitespace-pre-wrap max-h-96 overflow-y-auto",
            result.is_error 
              ? "bg-red-50 dark:bg-red-950/30 text-red-900 dark:text-red-100 border border-red-200 dark:border-red-800"
              : "bg-muted text-foreground"
          )}>
            {typeof result.content === 'string' 
              ? truncateOutput(result.content)
              : JSON.stringify(result.content, null, 2)}
          </pre>
        </div>
      )}
      
      {/* Working directory if present */}
      {input?.cwd && (
        <div className="text-xs text-muted-foreground">
          Working directory: {input.cwd}
        </div>
      )}
    </div>
  );
}