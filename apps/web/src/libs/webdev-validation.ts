import { z } from 'zod';

/**
 * Sandbox provider options for WebDev Preview
 */
export const SANDBOX_PROVIDERS = ['vercel-sandbox', 'disabled'] as const;

export const SANDBOX_DISABLED_REASONS = ['VERCEL_SANDBOX_NOT_CONFIGURED'] as const;

/**
 * Model entry for multi-model generation (1-5 models)
 */
const webdevModelEntrySchema = z.object({
  modelId: z
    .string()
    .trim()
    .min(1, 'Model ID is required')
    .max(200, 'Model ID must be less than 200 characters'),
  keyId: z.uuid('Invalid API key ID'),
});

/**
 * POST /api/webdev/generate — Start AI code generation for 1-5 models
 */
export const webdevGenerateSchema = z.object({
  prompt: z
    .string()
    .trim()
    .min(1, 'Prompt is required')
    .max(50000, 'Prompt must be less than 50000 characters'),
  models: z
    .array(webdevModelEntrySchema)
    .min(1, 'At least 1 model is required')
    .max(5, 'Maximum 5 models allowed'),
  sessionId: z.uuid('Invalid session ID').optional(),
  conversationId: z.uuid('Invalid conversation ID').optional(),
});

/**
 * File entry for sandbox creation
 */
const webdevFileSchema = z.object({
  path: z
    .string()
    .trim()
    .min(1, 'File path is required')
    .max(500, 'File path must be less than 500 characters'),
  content: z.string().max(500000, 'File content must be less than 500000 characters'),
});

/**
 * POST /api/webdev/sandbox — Create a sandbox from generated files
 */
export const webdevSandboxCreateSchema = z.object({
  files: z
    .array(webdevFileSchema)
    .min(1, 'At least 1 file is required')
    .max(100, 'Maximum 100 files allowed'),
  sessionId: z.uuid('Invalid session ID'),
  responseId: z.uuid('Invalid response ID'),
  snapshotId: z.string().trim().max(200, 'Snapshot ID too long').optional(),
});

/**
 * DELETE /api/webdev/sandbox — Delete a sandbox
 */
export const webdevSandboxDeleteSchema = z.object({
  sandboxId: z
    .string()
    .trim()
    .min(1, 'Sandbox ID is required')
    .max(200, 'Sandbox ID must be less than 200 characters'),
});

/**
 * WebDev feature configuration (returned by /api/webdev/config)
 */
export const webdevConfigSchema = z.object({
  enabled: z.boolean(),
  provider: z.enum(SANDBOX_PROVIDERS),
  reason: z.enum(SANDBOX_DISABLED_REASONS).optional(),
});

export type WebdevGenerateInput = z.infer<typeof webdevGenerateSchema>;
export type WebdevModelEntry = z.infer<typeof webdevModelEntrySchema>;
export type WebdevFileEntry = z.infer<typeof webdevFileSchema>;
export type WebdevSandboxCreateInput = z.infer<typeof webdevSandboxCreateSchema>;
export type WebdevSandboxDeleteInput = z.infer<typeof webdevSandboxDeleteSchema>;
export type WebdevConfigInput = z.infer<typeof webdevConfigSchema>;

/**
 * PATCH /api/webdev/session — Follow-up on an existing session
 */
export const webdevFollowUpSchema = z.object({
  sessionId: z.uuid('Invalid session ID'),
  prompt: z
    .string()
    .trim()
    .min(1, 'Prompt is required')
    .max(50000, 'Prompt must be less than 50000 characters'),
});

export type WebdevFollowUpInput = z.infer<typeof webdevFollowUpSchema>;

/**
 * POST /api/webdev/sandbox/shared — Create sandbox for a shared session (no auth)
 */
export const webdevSharedSandboxSchema = z.object({
  shareToken: z.string().min(1, 'Share token is required'),
  responseId: z.uuid('Invalid response ID'),
  snapshotId: z.string().trim().max(200, 'Snapshot ID too long').optional(),
});

export type WebdevSharedSandboxInput = z.infer<typeof webdevSharedSandboxSchema>;
