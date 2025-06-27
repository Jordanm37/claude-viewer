import { ReactNode } from 'react';

export interface ToolInvocation {
  type: 'tool_use';
  name: string;
  input: any;
  id?: string;
}

export interface ToolResult {
  type: 'tool_result';
  content: any;
  is_error?: boolean;
  tool_use_id?: string;
}

export interface ToolRenderProps {
  invocation?: ToolInvocation;
  result?: ToolResult;
  onCopy?: (content: string) => void;
}

export interface RendererComponent {
  (props: ToolRenderProps): ReactNode;
}

export interface ToolRendererRegistry {
  [toolName: string]: RendererComponent;
}