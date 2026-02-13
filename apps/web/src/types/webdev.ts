import type { WorkflowMetrics } from './workflow';

/**
 * Maximum number of models that can be compared simultaneously
 */
export const MAX_WEBDEV_MODELS = 5;

/**
 * WebDev feature status — tracks the overall session phase
 */
export type WebDevPhase = 'idle' | 'generating' | 'building' | 'ready' | 'error';

/**
 * WebDev response status — maps to database webdev_status enum
 */
export type WebDevStatus = 'generating' | 'building' | 'ready' | 'error' | 'expired';

/**
 * Per-sandbox lifecycle status
 */
export type SandboxStatus =
  | 'idle'
  | 'creating'
  | 'installing'
  | 'starting'
  | 'ready'
  | 'error'
  | 'expired'
  | 'stopped';

/**
 * Feature availability configuration returned by /api/webdev/config
 */
export interface WebDevConfig {
  enabled: boolean;
  provider: 'vercel-sandbox' | 'disabled';
  reason?: 'VERCEL_SANDBOX_NOT_CONFIGURED';
  limits?: {
    maxDurationMinutes: number;
    remainingCreations?: number;
  };
}

/**
 * Per-model sandbox state — one per workflow/model in a session
 */
export interface SandboxState {
  sandboxId: string | null;
  previewUrl: string | null;
  status: SandboxStatus;
  files: Record<string, string>;
  activeFile: string | null;
  terminalOutput: string[];
  error: string | null;
  expiresAt: string | null;
}

/**
 * Build step for progress display during sandbox creation
 */
export interface BuildStep {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  timestamp?: number;
}

/**
 * A generated file with path and content
 */
export interface WebDevFile {
  path: string;
  content: string;
}

/**
 * Model option for webdev model selector UI
 */
export interface WebDevOptionModel {
  workflowId: string;
  modelId: string;
  keyId: string;
  providerName: string;
  modelName: string;
  badgeColor: ModelBadgeColor;
}

/**
 * Activity log entry for the building overlay / progress display
 */
export interface ActivityLogEntry {
  id: string;
  workflowId: string;
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
  timestamp: number;
}

/**
 * WebDev store state — tracks the overall session and per-model sandboxes
 */
export interface WebDevState {
  sessionId: string | null;
  /** Linked conversation ID from the arena page */
  conversationId: string | null;
  phase: WebDevPhase;
  /** Map of workflowId to sandbox state (one per model) */
  sandboxes: Map<string, SandboxState>;
  /** Currently active/selected workflow tab in comparison mode */
  activeWorkflowId: string | null;
  /** Cached feature config from /api/webdev/config */
  featureConfig: WebDevConfig | null;
  /** Current prompt text */
  prompt: string;
}

/**
 * WebDev store actions
 */
export interface WebDevActions {
  // Session management
  setSessionId: (id: string | null) => void;
  setConversationId: (id: string | null) => void;
  setPhase: (phase: WebDevPhase) => void;
  resetSession: () => void;

  // Sandbox management (per-model)
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

  // Active model tab
  setActiveWorkflowId: (id: string | null) => void;

  // Feature config
  setFeatureConfig: (config: WebDevConfig | null) => void;
  checkConfig: () => Promise<void>;

  // Prompt
  setPrompt: (prompt: string) => void;

  // Selectors
  getSandbox: (workflowId: string) => SandboxState | undefined;
  getActiveSandbox: () => SandboxState | undefined;
  isAnyBuildingOrReady: () => boolean;
}

export type WebDevStore = WebDevState & WebDevActions;

/**
 * SSE stream events for /api/webdev/generate
 * Each event includes workflowId to demultiplex parallel model streams on the client
 */
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

/**
 * Request body for POST /api/webdev/generate
 */
export interface WebDevGenerateRequest {
  workflowId: string;
  prompt: string;
  sessionId?: string;
  modelId: string;
  keyId: string;
}

/**
 * Request body for POST /api/webdev/sandbox (standalone sandbox creation)
 */
export interface WebDevSandboxRequest {
  workflowId: string;
  sessionId: string;
  files: Array<{ path: string; content: string }>;
}

/**
 * Response from POST /api/webdev/sandbox
 */
export interface WebDevSandboxResponse {
  sandboxId: string;
  previewUrl: string;
  expiresAt: string | null;
}

/**
 * Database-aligned type for webdev_responses table (per-model response within a session)
 */
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

/**
 * Database-aligned type for webdev_sessions table
 */
export interface WebDevSession {
  id: string;
  userId: string;
  prompt: string;
  modelIds: string[];
  status: 'active' | 'completed' | 'expired';
  createdAt: string;
  updatedAt: string;
}

/**
 * Database-aligned type for webdev_iterations table (version history)
 */
export interface WebDevIteration {
  id: string;
  sessionId: string;
  version: number;
  prompt: string;
  createdAt: string;
}

/**
 * Badge colors for distinguishing models in comparison mode (up to 5 models)
 */
export const MODEL_BADGE_COLORS = [
  '#7C3AED', // violet-600
  '#B45309', // amber-700
  '#0E7490', // cyan-700
  '#BE185D', // pink-700
  '#047857', // emerald-700
] as const;

export type ModelBadgeColor = (typeof MODEL_BADGE_COLORS)[number];

/**
 * Default sandbox state factory
 */
export const DEFAULT_SANDBOX_STATE: SandboxState = {
  sandboxId: null,
  previewUrl: null,
  status: 'idle',
  files: {},
  activeFile: null,
  terminalOutput: [],
  error: null,
  expiresAt: null,
};

/**
 * Default webdev state
 */
export const DEFAULT_WEBDEV_STATE: WebDevState = {
  sessionId: null,
  conversationId: null,
  phase: 'idle',
  sandboxes: new Map(),
  activeWorkflowId: null,
  featureConfig: null,
  prompt: '',
};
