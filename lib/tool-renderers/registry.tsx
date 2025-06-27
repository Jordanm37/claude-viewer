import { 
  FileCode, 
  FileEdit, 
  FileText, 
  FileJson,
  FilePlus,
  FileX,
  FolderOpen,
  Search,
  Globe,
  Terminal,
  GitBranch,
  GitCommit,
  GitPullRequest,
  GitMerge,
  Database,
  Package,
  Zap,
  Bug,
  CheckCircle,
  XCircle,
  AlertCircle,
  Code,
  Eye,
  Download,
  Upload,
  Trash,
  Copy,
  Move,
  RefreshCw,
  Settings,
  BookOpen,
  MessageSquare,
  List,
  Hash,
  Link,
  Image,
  PenTool,
  Calculator,
  Calendar,
  Clock,
  LucideIcon
} from 'lucide-react';
import { ReactNode } from 'react';

export interface ToolStyle {
  icon: LucideIcon;
  color: string;
  bgColor: string;
  borderColor: string;
  label: string;
  category: 'file' | 'code' | 'search' | 'git' | 'system' | 'web' | 'data' | 'other';
}

export type ToolRenderer = (props: {
  input: any;
  result?: any;
  isError?: boolean;
}) => ReactNode;

export const toolRegistry: Record<string, ToolStyle> = {
  // File Operations
  'Read': {
    icon: FileText,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    borderColor: 'border-blue-200 dark:border-blue-800',
    label: 'Read File',
    category: 'file'
  },
  'Write': {
    icon: FileEdit,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950/30',
    borderColor: 'border-green-200 dark:border-green-800',
    label: 'Write File',
    category: 'file'
  },
  'Edit': {
    icon: FileEdit,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    borderColor: 'border-amber-200 dark:border-amber-800',
    label: 'Edit File',
    category: 'file'
  },
  'MultiEdit': {
    icon: FileEdit,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    borderColor: 'border-amber-200 dark:border-amber-800',
    label: 'Multi Edit',
    category: 'file'
  },
  'Create': {
    icon: FilePlus,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950/30',
    borderColor: 'border-green-200 dark:border-green-800',
    label: 'Create File',
    category: 'file'
  },
  'Delete': {
    icon: FileX,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    borderColor: 'border-red-200 dark:border-red-800',
    label: 'Delete File',
    category: 'file'
  },
  'LS': {
    icon: FolderOpen,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    borderColor: 'border-purple-200 dark:border-purple-800',
    label: 'List Directory',
    category: 'file'
  },
  'Glob': {
    icon: Search,
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950/30',
    borderColor: 'border-indigo-200 dark:border-indigo-800',
    label: 'File Search',
    category: 'file'
  },
  'Grep': {
    icon: Search,
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950/30',
    borderColor: 'border-indigo-200 dark:border-indigo-800',
    label: 'Content Search',
    category: 'file'
  },

  // Code Execution
  'Bash': {
    icon: Terminal,
    color: 'text-slate-600 dark:text-slate-400',
    bgColor: 'bg-slate-50 dark:bg-slate-950/30',
    borderColor: 'border-slate-200 dark:border-slate-800',
    label: 'Run Command',
    category: 'code'
  },
  'execute': {
    icon: Zap,
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/30',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    label: 'Execute Code',
    category: 'code'
  },
  'run_python': {
    icon: Code,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    borderColor: 'border-blue-200 dark:border-blue-800',
    label: 'Run Python',
    category: 'code'
  },
  'run_javascript': {
    icon: Code,
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/30',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    label: 'Run JavaScript',
    category: 'code'
  },

  // Git Operations
  'git': {
    icon: GitBranch,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30',
    borderColor: 'border-orange-200 dark:border-orange-800',
    label: 'Git Command',
    category: 'git'
  },
  'git_commit': {
    icon: GitCommit,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30',
    borderColor: 'border-orange-200 dark:border-orange-800',
    label: 'Git Commit',
    category: 'git'
  },
  'git_push': {
    icon: Upload,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30',
    borderColor: 'border-orange-200 dark:border-orange-800',
    label: 'Git Push',
    category: 'git'
  },
  'git_pull': {
    icon: Download,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30',
    borderColor: 'border-orange-200 dark:border-orange-800',
    label: 'Git Pull',
    category: 'git'
  },
  'create_pull_request': {
    icon: GitPullRequest,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30',
    borderColor: 'border-orange-200 dark:border-orange-800',
    label: 'Create PR',
    category: 'git'
  },

  // Web Operations
  'WebSearch': {
    icon: Globe,
    color: 'text-cyan-600 dark:text-cyan-400',
    bgColor: 'bg-cyan-50 dark:bg-cyan-950/30',
    borderColor: 'border-cyan-200 dark:border-cyan-800',
    label: 'Web Search',
    category: 'web'
  },
  'WebFetch': {
    icon: Download,
    color: 'text-cyan-600 dark:text-cyan-400',
    bgColor: 'bg-cyan-50 dark:bg-cyan-950/30',
    borderColor: 'border-cyan-200 dark:border-cyan-800',
    label: 'Fetch URL',
    category: 'web'
  },
  'browse': {
    icon: Globe,
    color: 'text-cyan-600 dark:text-cyan-400',
    bgColor: 'bg-cyan-50 dark:bg-cyan-950/30',
    borderColor: 'border-cyan-200 dark:border-cyan-800',
    label: 'Browse Web',
    category: 'web'
  },

  // System/Tool Operations
  'Task': {
    icon: CheckCircle,
    color: 'text-teal-600 dark:text-teal-400',
    bgColor: 'bg-teal-50 dark:bg-teal-950/30',
    borderColor: 'border-teal-200 dark:border-teal-800',
    label: 'Run Task',
    category: 'system'
  },
  'TodoRead': {
    icon: List,
    color: 'text-violet-600 dark:text-violet-400',
    bgColor: 'bg-violet-50 dark:bg-violet-950/30',
    borderColor: 'border-violet-200 dark:border-violet-800',
    label: 'Read Todo',
    category: 'system'
  },
  'TodoWrite': {
    icon: CheckCircle,
    color: 'text-violet-600 dark:text-violet-400',
    bgColor: 'bg-violet-50 dark:bg-violet-950/30',
    borderColor: 'border-violet-200 dark:border-violet-800',
    label: 'Update Todo',
    category: 'system'
  },
  'exit_plan_mode': {
    icon: Settings,
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-50 dark:bg-gray-950/30',
    borderColor: 'border-gray-200 dark:border-gray-800',
    label: 'Exit Planning',
    category: 'system'
  },

  // Data Operations
  'database_query': {
    icon: Database,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    label: 'Database Query',
    category: 'data'
  },
  'api_call': {
    icon: Zap,
    color: 'text-pink-600 dark:text-pink-400',
    bgColor: 'bg-pink-50 dark:bg-pink-950/30',
    borderColor: 'border-pink-200 dark:border-pink-800',
    label: 'API Call',
    category: 'data'
  },

  // Notebook Operations
  'NotebookRead': {
    icon: BookOpen,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30',
    borderColor: 'border-orange-200 dark:border-orange-800',
    label: 'Read Notebook',
    category: 'file'
  },
  'NotebookEdit': {
    icon: PenTool,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30',
    borderColor: 'border-orange-200 dark:border-orange-800',
    label: 'Edit Notebook',
    category: 'file'
  },

  // MCP Tools
  'mcp__filesystem__read_file': {
    icon: FileText,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    borderColor: 'border-blue-200 dark:border-blue-800',
    label: 'MCP Read File',
    category: 'file'
  },
  'mcp__filesystem__write_file': {
    icon: FileEdit,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950/30',
    borderColor: 'border-green-200 dark:border-green-800',
    label: 'MCP Write File',
    category: 'file'
  },
  'mcp__filesystem__list_directory': {
    icon: FolderOpen,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    borderColor: 'border-purple-200 dark:border-purple-800',
    label: 'MCP List Dir',
    category: 'file'
  },
  'mcp__github__create_pull_request': {
    icon: GitPullRequest,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30',
    borderColor: 'border-orange-200 dark:border-orange-800',
    label: 'GitHub Create PR',
    category: 'git'
  },
  
  // Default fallback
  'default': {
    icon: FileCode,
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-black/5 dark:bg-white/5',
    borderColor: 'border-gray-200 dark:border-gray-800',
    label: 'Tool',
    category: 'other'
  }
};

export function getToolStyle(toolName: string): ToolStyle {
  return toolRegistry[toolName] || toolRegistry.default;
}

export function getToolIcon(toolName: string): LucideIcon {
  return getToolStyle(toolName).icon;
}

export function getToolColors(toolName: string) {
  const style = getToolStyle(toolName);
  return {
    color: style.color,
    bgColor: style.bgColor,
    borderColor: style.borderColor
  };
}