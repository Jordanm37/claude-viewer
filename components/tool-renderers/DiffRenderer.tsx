'use client';

import { useState } from 'react';
import { ToolRenderProps } from '@/lib/tool-renderers/types';
import { cn } from '@/lib/utils';
import { FileEdit, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function DiffRenderer({ invocation, result, onCopy }: ToolRenderProps) {
  const [copied, setCopied] = useState(false);
  
  const input = invocation?.input;
  const isMultiEdit = invocation?.name === 'MultiEdit';
  
  if (!input) return null;

  const renderSingleEdit = (edit: any, index?: number) => {
    const oldString = edit.old_string || edit.oldText || '';
    const newString = edit.new_string || edit.newText || '';
    
    return (
      <div key={index} className="space-y-2">
        {index !== undefined && (
          <div className="text-xs text-muted-foreground font-medium">
            Edit {index + 1}
          </div>
        )}
        
        {oldString && (
          <div className="space-y-1">
            <div className="text-xs font-medium text-red-600 dark:text-red-400">- Remove:</div>
            <pre className="text-xs bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-2 rounded overflow-x-auto whitespace-pre-wrap">
              {oldString}
            </pre>
          </div>
        )}
        
        {newString && (
          <div className="space-y-1">
            <div className="text-xs font-medium text-green-600 dark:text-green-400">+ Add:</div>
            <pre className="text-xs bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-2 rounded overflow-x-auto whitespace-pre-wrap">
              {newString}
            </pre>
          </div>
        )}
        
        {edit.replace_all && (
          <div className="text-xs text-muted-foreground italic">
            Replace all occurrences
          </div>
        )}
      </div>
    );
  };

  const handleCopy = () => {
    const content = JSON.stringify(input, null, 2);
    if (onCopy) {
      onCopy(content);
    } else {
      navigator.clipboard.writeText(content);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileEdit size={14} className="text-amber-600 dark:text-amber-400" />
          <span className="text-sm font-medium">
            {input.file_path || input.path}
          </span>
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
      
      <div className="space-y-3">
        {isMultiEdit && input.edits ? (
          input.edits.map((edit: any, index: number) => renderSingleEdit(edit, index))
        ) : (
          renderSingleEdit(input)
        )}
      </div>
      
      {result?.is_error && (
        <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 p-2 rounded">
          Error: {typeof result.content === 'string' ? result.content : 'Edit failed'}
        </div>
      )}
    </div>
  );
}