import type { WorkflowMetrics } from './workflow';

export const MAX_WEBDEV_MODELS = 5;

export type WebDevPhase = 'idle' | 'generating' | 'building' | 'ready' | 'error';

/** Maps to database webdev_status enum */
export type WebDevStatus = 'generating' | 'building' | 'ready' | 'error' | 'expired';

export type SandboxStatus =
  | 'idle'
  | 'creating'
  | 'installing'
  | 'starting'
  | 'ready'
  | 'snapshotting'
  | 'restoring'
  | 'error'
  | 'expired'
  | 'stopped';

export interface WebDevConfig {
  enabled: boolean;
  provider: 'vercel-sandbox' | 'disabled';
  reason?: 'VERCEL_SANDBOX_NOT_CONFIGURED';
  limits?: {
    maxDurationMinutes: number;
    remainingCreations?: number;
  };
}

export interface SandboxState {
  sandboxId: string | null;
  previewUrl: string | null;
  snapshotId: string | null;
  status: SandboxStatus;
  files: Record<string, string>;
  activeFile: string | null;
  terminalOutput: string[];
  error: string | null;
  expiresAt: string | null;
}

export interface BuildStep {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  timestamp?: number;
}

export interface WebDevFile {
  path: string;
  content: string;
}

export interface WebDevOptionModel {
  workflowId: string;
  modelId: string;
  keyId: string;
  providerName: string;
  modelName: string;
  badgeColor: ModelBadgeColor;
}

export interface ActivityLogEntry {
  id: string;
  workflowId: string;
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
  timestamp: number;
}

export interface WebDevState {
  sessionId: string | null;
  conversationId: string | null;
  phase: WebDevPhase;
  sandboxes: Map<string, SandboxState>;
  activeWorkflowId: string | null;
  featureConfig: WebDevConfig | null;
  prompt: string;
  submittedPrompt: string;
}

export interface WebDevActions {
  setSessionId: (id: string | null) => void;
  setConversationId: (id: string | null) => void;
  setPhase: (phase: WebDevPhase) => void;
  resetSession: () => void;
  initSandbox: (workflowId: string) => void;
  updateSandboxStatus: (workflowId: string, status: SandboxStatus, error?: string) => void;
  setSandboxReady: (
    workflowId: string,
    sandboxId: string,
    previewUrl: string,
    expiresAt: string | null,
  ) => void;
  setSandboxFiles: (workflowId: string, files: Record<string, string>) => void;
  appendSandboxFile: (workflowId: string, path: string, content: string) => void;
  setActiveFile: (workflowId: string, path: string) => void;
  appendTerminalOutput: (workflowId: string, line: string) => void;
  destroySandbox: (workflowId: string) => Promise<void>;
  destroyAllSandboxes: () => Promise<void>;
  setActiveWorkflowId: (id: string | null) => void;
  setSnapshotId: (workflowId: string, snapshotId: string | null) => void;
  setFeatureConfig: (config: WebDevConfig | null) => void;
  checkConfig: () => Promise<void>;
  setPrompt: (prompt: string) => void;
  setSubmittedPrompt: (prompt: string) => void;
  getSandbox: (workflowId: string) => SandboxState | undefined;
  getActiveSandbox: () => SandboxState | undefined;
  isAnyBuildingOrReady: () => boolean;
}

export type WebDevStore = WebDevState & WebDevActions;

/** SSE events — includes workflowId to demux parallel model streams */
export type WebDevStreamEvent =
  | { type: 'code-delta'; workflowId: string; chunk: string }
  | { type: 'file'; workflowId: string; path: string; content: string }
  | { type: 'sandbox-creating'; workflowId: string }
  | { type: 'sandbox-installing'; workflowId: string }
  | { type: 'sandbox-starting'; workflowId: string }
  | {
      type: 'sandbox-ready';
      workflowId: string;
      previewUrl: string;
      sandboxId: string;
      expiresAt: string | null;
    }
  | { type: 'error'; workflowId: string; message: string }
  | { type: 'complete'; workflowId: string; sessionId: string; metrics?: WorkflowMetrics }
  | { type: 'heartbeat'; workflowId: string };

export type WebDevStreamEventType = WebDevStreamEvent['type'];

export interface WebDevGenerateRequest {
  workflowId: string;
  prompt: string;
  sessionId?: string;
  modelId: string;
  keyId: string;
}

export interface WebDevSandboxRequest {
  workflowId: string;
  sessionId: string;
  files: Array<{ path: string; content: string }>;
}

export interface WebDevSandboxResponse {
  sandboxId: string;
  previewUrl: string;
  expiresAt: string | null;
}

/** DB: webdev_responses */
export interface WebDevResponse {
  id: string;
  sessionId: string;
  modelId: string;
  keyId: string;
  files: Record<string, string>;
  sandboxId: string | null;
  previewUrl: string | null;
  status: WebDevStatus;
  error: string | null;
  expiresAt: string | null;
  createdAt: string;
}

/** DB: webdev_sessions */
export interface WebDevSession {
  id: string;
  userId: string;
  prompt: string;
  modelIds: string[];
  status: 'active' | 'completed' | 'expired';
  createdAt: string;
  updatedAt: string;
}

/** DB: webdev_iterations */
export interface WebDevIteration {
  id: string;
  sessionId: string;
  version: number;
  prompt: string;
  createdAt: string;
}

export const MODEL_BADGE_COLORS = [
  '#7C3AED', // violet-600
  '#B45309', // amber-700
  '#0E7490', // cyan-700
  '#BE185D', // pink-700
  '#047857', // emerald-700
] as const;

export type ModelBadgeColor = (typeof MODEL_BADGE_COLORS)[number];

export const DEFAULT_SANDBOX_STATE: SandboxState = {
  sandboxId: null,
  previewUrl: null,
  snapshotId: null,
  status: 'idle',
  files: {},
  activeFile: null,
  terminalOutput: [],
  error: null,
  expiresAt: null,
};

export const DEFAULT_WEBDEV_STATE: WebDevState = {
  sessionId: null,
  conversationId: null,
  phase: 'idle',
  sandboxes: new Map(),
  activeWorkflowId: null,
  featureConfig: null,
  prompt: '',
  submittedPrompt: '',
};
