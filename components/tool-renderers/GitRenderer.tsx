'use client';

import { useState } from 'react';
import { ToolRenderProps } from '@/lib/tool-renderers/types';
import { cn } from '@/lib/utils';
import { GitBranch, GitCommit, GitPullRequest, Copy, CheckCircle, XCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getToolStyle } from '@/lib/tool-renderers/registry';

export function GitRenderer({ invocation, result, onCopy }: ToolRenderProps) {
  const [copied, setCopied] = useState(false);
  
  const input = invocation?.input;
  const toolName = invocation?.name || '';
  const toolStyle = getToolStyle(toolName);
  const Icon = toolStyle.icon;
  
  const handleCopy = () => {
    const content = typeof result?.content === 'string' 
      ? result.content 
      : JSON.stringify(result?.content || input, null, 2);
    if (onCopy) {
      onCopy(content);
    } else {
      navigator.clipboard.writeText(content);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderGitCommand = () => {
    // Extract git command if it's a bash command
    if (input?.command?.startsWith('git ')) {
      return input.command;
    }
    
    // Build git command from PR/commit inputs
    if (toolName.includes('pull_request')) {
      return `Creating PR: ${input.title || 'Untitled'}`;
    }
    
    if (toolName.includes('commit')) {
      return `git commit -m "${input.message || 'Commit message'}"`;
    }
    
    return null;
  };

  const renderPRDetails = () => {
    if (!toolName.includes('pull_request')) return null;
    
    return (
      <div className="space-y-2 text-sm">
        {input.title && (
          <div>
            <span className="text-muted-foreground">Title:</span>{' '}
            <span className="font-medium">{input.title}</span>
          </div>
        )}
        {(input.head && input.base) && (
          <div>
            <span className="text-muted-foreground">From:</span>{' '}
            <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded">{input.head}</span>
            {' → '}
            <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded">{input.base}</span>
          </div>
        )}
        {input.body && (
          <div>
            <span className="text-muted-foreground">Description:</span>
            <div className="mt-1 text-xs p-2 bg-muted/50 rounded whitespace-pre-wrap">
              {input.body}
            </div>
          </div>
        )}
      </div>
    );
  };

  const gitCommand = renderGitCommand();

  return (
    <div className="space-y-3">
      {/* Header */}
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
      
      {/* Git command display */}
      {gitCommand && (
        <div className="text-sm font-mono bg-slate-950 text-slate-100 dark:bg-slate-900 p-2 rounded">
          <span className="text-slate-400">$ </span>
          {gitCommand}
        </div>
      )}
      
      {/* PR Details */}
      {renderPRDetails()}
      
      {/* Repository info */}
      {(input.owner && input.repo) && (
        <div className="text-xs text-muted-foreground">
          Repository: {input.owner}/{input.repo}
        </div>
      )}
      
      {/* Result/Output */}
      {result && (
        <div className="space-y-2">
          {!result.is_error ? (
            <>
              {/* Success message for PR creation */}
              {toolName.includes('pull_request') && result.content?.html_url && (
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <CheckCircle size={14} />
                  <span>PR created successfully</span>
                  <a 
                    href={result.content.html_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    View PR →
                  </a>
                </div>
              )}
              
              {/* Generic output */}
              <pre className="text-xs p-3 bg-muted rounded font-mono overflow-x-auto whitespace-pre-wrap max-h-64 overflow-y-auto">
                {typeof result.content === 'string' 
                  ? result.content 
                  : JSON.stringify(result.content, null, 2)}
              </pre>
            </>
          ) : (
            <div className="flex items-start gap-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 p-2 rounded">
              <XCircle size={14} className="flex-shrink-0 mt-0.5" />
              <span>
                {typeof result.content === 'string' ? result.content : 'Git operation failed'}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}