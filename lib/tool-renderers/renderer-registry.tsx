import { ToolRendererRegistry } from './types';
import { DiffRenderer } from '@/components/tool-renderers/DiffRenderer';
import { CodeRenderer } from '@/components/tool-renderers/CodeRenderer';
import { SearchRenderer } from '@/components/tool-renderers/SearchRenderer';
import { FileRenderer } from '@/components/tool-renderers/FileRenderer';
import { GitRenderer } from '@/components/tool-renderers/GitRenderer';

export const toolRenderers: ToolRendererRegistry = {
  // File editing
  'Edit': DiffRenderer,
  'MultiEdit': DiffRenderer,
  'mcp__filesystem__edit_file': DiffRenderer,
  
  // Code execution
  'Bash': CodeRenderer,
  'execute': CodeRenderer,
  'run_python': CodeRenderer,
  'run_javascript': CodeRenderer,
  'mcp__puppeteer__puppeteer_evaluate': CodeRenderer,
  
  // Search operations
  'WebSearch': SearchRenderer,
  'Grep': SearchRenderer,
  'Glob': SearchRenderer,
  'search': SearchRenderer,
  'mcp__tavily__tavily-search': SearchRenderer,
  'mcp__filesystem__search_files': SearchRenderer,
  
  // File operations
  'Read': FileRenderer,
  'Write': FileRenderer,
  'Create': FileRenderer,
  'LS': FileRenderer,
  'mcp__filesystem__read_file': FileRenderer,
  'mcp__filesystem__write_file': FileRenderer,
  'mcp__filesystem__list_directory': FileRenderer,
  'mcp__filesystem__directory_tree': FileRenderer,
  'NotebookRead': FileRenderer,
  'NotebookEdit': FileRenderer,
  
  // Git operations
  'git': GitRenderer,
  'git_commit': GitRenderer,
  'git_push': GitRenderer,
  'git_pull': GitRenderer,
  'create_pull_request': GitRenderer,
  'mcp__github__create_pull_request': GitRenderer,
  'mcp__github__create_issue': GitRenderer,
  'mcp__github__fork_repository': GitRenderer,
  'mcp__github__create_branch': GitRenderer,
};

export function getToolRenderer(toolName: string) {
  return toolRenderers[toolName] || null;
}