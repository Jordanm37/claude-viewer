export interface SessionMessage {
  parentUuid: string | null;
  isSidechain: boolean;
  userType: string;
  cwd: string;
  sessionId: string;
  version: string;
  type: 'user' | 'assistant' | 'system' | 'attachment' | 'summary';
  message?: {
    role: 'user' | 'assistant' | 'system';
    content: string | Array<{
      type: string;
      text?: string;
      name?: string;
      input?: any;
      is_error?: boolean;
      content?: any;
    }>;
    id?: string;
    model?: string;
    stop_reason?: string;
    stop_sequence?: string | null;
    usage?: {
      input_tokens: number;
      output_tokens: number;
      cache_creation_input_tokens?: number;
      cache_read_input_tokens?: number;
    };
  };
  summary?: string;
  leafUuid?: string;
  uuid: string;
  timestamp: string;
  requestId?: string;
}

export interface SessionFile {
  id: string;
  project: string;
  filepath: string;
  messages: SessionMessage[];
  summaries: SessionMessage[];
  rootSessionId: string;
  isRoot: boolean;
  continuationOf?: string;
}

export interface SessionThread {
  rootSessionId: string;
  files: SessionFile[];
  messages: SessionMessage[];
  summaries: SessionMessage[];
  title?: string;
}

export interface Project {
  name: string;
  sessions: SessionThread[];
}