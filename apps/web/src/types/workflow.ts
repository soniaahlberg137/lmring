import type { ModelConfig } from './arena';

export type WorkflowStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface WorkflowMessageMetrics {
  responseTime?: number;
  tokenCount?: number;
  timeToFirstToken?: number;
  tokensPerSecond?: number;
}

export interface FileAttachment {
  type: 'file';
  url: string;
  mediaType: string;
  filename: string;
  fileId?: string;
}

export interface VideoAttachment {
  url: string;
  storagePath?: string;
  mimeType: string;
  thumbnailUrl?: string;
  duration?: number;
}

export interface WorkflowMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  reasoning?: string;
  timestamp: Date;
  metrics?: WorkflowMessageMetrics;
  attachments?: FileAttachment[];
  videoAttachment?: VideoAttachment;
}

export interface WorkflowMetrics {
  totalTime: number;
  timeToFirstToken?: number;
  tokensPerSecond?: number;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

export interface WorkflowConfig extends ModelConfig {}

export const DEFAULT_WORKFLOW_CONFIG: WorkflowConfig = {
  temperature: 0.7,
  maxTokens: 2048,
};

export interface PendingResponse {
  content: string;
  reasoning?: string;
  startTime: number;
  isVideoGenerating?: boolean;
}

export interface ArenaWorkflow {
  id: string;
  modelId: string;
  keyId: string;
  status: WorkflowStatus;
  messages: WorkflowMessage[];
  pendingResponse?: PendingResponse;
  config: WorkflowConfig;
  synced: boolean;
  customPrompt: string;
  metrics?: WorkflowMetrics;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type WorkflowStreamEventType =
  | 'ttft'
  | 'chunk'
  | 'reasoning'
  | 'complete'
  | 'error'
  | 'heartbeat'
  | 'video';

export interface WorkflowStreamEvent {
  type: WorkflowStreamEventType;
  workflowId: string;
  chunk?: string;
  reasoning?: string;
  metrics?: WorkflowMetrics;
  error?: string;
  video?: {
    url: string;
    storagePath?: string;
    mimeType: string;
    thumbnailUrl?: string;
  };
}

export interface WorkflowImageAttachment {
  type: 'image';
  data: string;
  mediaType: string;
  filename?: string;
}

export interface WorkflowStreamRequest {
  workflowId: string;
  modelId: string;
  keyId: string;
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  config: {
    temperature: number;
    maxTokens: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
  };
  attachments?: WorkflowImageAttachment[];
}
