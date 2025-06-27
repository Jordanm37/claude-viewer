'use client';

import { useState } from 'react';
import { ToolRenderProps } from '@/lib/tool-renderers/types';
import { cn } from '@/lib/utils';
import { Search, Globe, FileSearch, Copy, ExternalLink, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function SearchRenderer({ invocation, result, onCopy }: ToolRenderProps) {
  const [copied, setCopied] = useState(false);
  
  const input = invocation?.input;
  const query = input?.query || input?.pattern || input?.q || '';
  const isWebSearch = invocation?.name === 'WebSearch' || invocation?.name?.includes('web');
  
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

  const renderSearchResult = (item: any, index: number) => {
    if (isWebSearch && item.url) {
      return (
        <div key={index} className="p-3 border rounded-lg space-y-1">
          <div className="flex items-start justify-between gap-2">
            <a 
              href={item.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
            >
              {item.title || item.url}
              <ExternalLink size={12} />
            </a>
          </div>
          {item.snippet && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {item.snippet}
            </p>
          )}
          <div className="text-xs text-muted-foreground">
            {new URL(item.url).hostname}
          </div>
        </div>
      );
    }
    
    // File search result
    return (
      <div key={index} className="p-2 bg-muted/50 rounded text-xs font-mono">
        {typeof item === 'string' ? item : JSON.stringify(item, null, 2)}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {/* Query Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isWebSearch ? (
            <Globe size={14} className="text-cyan-600 dark:text-cyan-400" />
          ) : (
            <Search size={14} className="text-indigo-600 dark:text-indigo-400" />
          )}
          <span className="text-sm font-medium">
            {isWebSearch ? 'Web Search' : 'Search'}
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
      
      {query && (
        <div className="p-2 bg-muted/50 rounded">
          <span className="text-xs text-muted-foreground">Query: </span>
          <span className="text-sm font-medium">{query}</span>
        </div>
      )}
      
      {/* Additional search parameters */}
      {(input?.include_domains || input?.exclude_domains || input?.path) && (
        <div className="text-xs space-y-1 text-muted-foreground">
          {input.include_domains && (
            <div>Include: {input.include_domains.join(', ')}</div>
          )}
          {input.exclude_domains && (
            <div>Exclude: {input.exclude_domains.join(', ')}</div>
          )}
          {input.path && (
            <div>Path: {input.path}</div>
          )}
        </div>
      )}
      
      {/* Results */}
      {result && !result.is_error && (
        <div className="space-y-2">
          <div className="text-sm font-medium">Results</div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {Array.isArray(result.content) ? (
              result.content.map((item, index) => renderSearchResult(item, index))
            ) : typeof result.content === 'object' && result.content.results ? (
              result.content.results.map((item: any, index: number) => renderSearchResult(item, index))
            ) : (
              <pre className="text-xs p-3 bg-muted rounded overflow-x-auto whitespace-pre-wrap">
                {typeof result.content === 'string' 
                  ? result.content 
                  : JSON.stringify(result.content, null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}
      
      {result?.is_error && (
        <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 p-2 rounded">
          Error: {typeof result.content === 'string' ? result.content : 'Search failed'}
        </div>
      )}
    </div>
  );
}