import { describe, expect, it } from 'vitest';
import {
  webdevConfigSchema,
  webdevGenerateSchema,
  webdevSandboxCreateSchema,
  webdevSandboxDeleteSchema,
} from '../webdev-validation';

describe('webdevGenerateSchema', () => {
  const validUUID = '550e8400-e29b-41d4-a716-446655440000';

  it('should accept valid input with 1 model', () => {
    const result = webdevGenerateSchema.safeParse({
      prompt: 'Build a todo app',
      models: [{ modelId: 'gpt-4', keyId: validUUID }],
    });
    expect(result.success).toBe(true);
  });

  it('should accept valid input with 5 models', () => {
    const models = Array.from({ length: 5 }, (_, i) => ({
      modelId: `model-${i}`,
      keyId: validUUID,
    }));
    const result = webdevGenerateSchema.safeParse({
      prompt: 'Build a weather app',
      models,
    });
    expect(result.success).toBe(true);
  });

  it('should accept optional sessionId', () => {
    const result = webdevGenerateSchema.safeParse({
      prompt: 'Build an app',
      models: [{ modelId: 'gpt-4', keyId: validUUID }],
      sessionId: validUUID,
    });
    expect(result.success).toBe(true);
  });

  it('should reject empty prompt', () => {
    const result = webdevGenerateSchema.safeParse({
      prompt: '',
      models: [{ modelId: 'gpt-4', keyId: validUUID }],
    });
    expect(result.success).toBe(false);
  });

  it('should reject whitespace-only prompt', () => {
    const result = webdevGenerateSchema.safeParse({
      prompt: '   ',
      models: [{ modelId: 'gpt-4', keyId: validUUID }],
    });
    expect(result.success).toBe(false);
  });

  it('should reject prompt exceeding 50000 characters', () => {
    const result = webdevGenerateSchema.safeParse({
      prompt: 'a'.repeat(50001),
      models: [{ modelId: 'gpt-4', keyId: validUUID }],
    });
    expect(result.success).toBe(false);
  });

  it('should reject empty models array', () => {
    const result = webdevGenerateSchema.safeParse({
      prompt: 'Build an app',
      models: [],
    });
    expect(result.success).toBe(false);
  });

  it('should reject more than 5 models', () => {
    const models = Array.from({ length: 6 }, (_, i) => ({
      modelId: `model-${i}`,
      keyId: validUUID,
    }));
    const result = webdevGenerateSchema.safeParse({
      prompt: 'Build an app',
      models,
    });
    expect(result.success).toBe(false);
  });

  it('should reject model with empty modelId', () => {
    const result = webdevGenerateSchema.safeParse({
      prompt: 'Build an app',
      models: [{ modelId: '', keyId: validUUID }],
    });
    expect(result.success).toBe(false);
  });

  it('should reject model with modelId exceeding 200 characters', () => {
    const result = webdevGenerateSchema.safeParse({
      prompt: 'Build an app',
      models: [{ modelId: 'a'.repeat(201), keyId: validUUID }],
    });
    expect(result.success).toBe(false);
  });

  it('should reject model with invalid keyId (not UUID)', () => {
    const result = webdevGenerateSchema.safeParse({
      prompt: 'Build an app',
      models: [{ modelId: 'gpt-4', keyId: 'not-a-uuid' }],
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid sessionId', () => {
    const result = webdevGenerateSchema.safeParse({
      prompt: 'Build an app',
      models: [{ modelId: 'gpt-4', keyId: validUUID }],
      sessionId: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });

  it('should trim prompt whitespace', () => {
    const result = webdevGenerateSchema.safeParse({
      prompt: '  Build an app  ',
      models: [{ modelId: 'gpt-4', keyId: validUUID }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.prompt).toBe('Build an app');
    }
  });
});

describe('webdevSandboxCreateSchema', () => {
  const validUUID = '550e8400-e29b-41d4-a716-446655440000';

  it('should accept valid input', () => {
    const result = webdevSandboxCreateSchema.safeParse({
      files: [{ path: 'src/App.tsx', content: 'export default () => <div/>' }],
      sessionId: validUUID,
      responseId: validUUID,
    });
    expect(result.success).toBe(true);
  });

  it('should accept up to 100 files', () => {
    const files = Array.from({ length: 100 }, (_, i) => ({
      path: `file-${i}.ts`,
      content: `content ${i}`,
    }));
    const result = webdevSandboxCreateSchema.safeParse({
      files,
      sessionId: validUUID,
      responseId: validUUID,
    });
    expect(result.success).toBe(true);
  });

  it('should reject empty files array', () => {
    const result = webdevSandboxCreateSchema.safeParse({
      files: [],
      sessionId: validUUID,
      responseId: validUUID,
    });
    expect(result.success).toBe(false);
  });

  it('should reject more than 100 files', () => {
    const files = Array.from({ length: 101 }, (_, i) => ({
      path: `file-${i}.ts`,
      content: `content ${i}`,
    }));
    const result = webdevSandboxCreateSchema.safeParse({
      files,
      sessionId: validUUID,
      responseId: validUUID,
    });
    expect(result.success).toBe(false);
  });

  it('should reject file with empty path', () => {
    const result = webdevSandboxCreateSchema.safeParse({
      files: [{ path: '', content: 'content' }],
      sessionId: validUUID,
      responseId: validUUID,
    });
    expect(result.success).toBe(false);
  });

  it('should reject file with path exceeding 500 characters', () => {
    const result = webdevSandboxCreateSchema.safeParse({
      files: [{ path: 'a'.repeat(501), content: 'content' }],
      sessionId: validUUID,
      responseId: validUUID,
    });
    expect(result.success).toBe(false);
  });

  it('should reject file with content exceeding 500000 characters', () => {
    const result = webdevSandboxCreateSchema.safeParse({
      files: [{ path: 'big.ts', content: 'x'.repeat(500001) }],
      sessionId: validUUID,
      responseId: validUUID,
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid sessionId', () => {
    const result = webdevSandboxCreateSchema.safeParse({
      files: [{ path: 'a.ts', content: 'c' }],
      sessionId: 'bad',
      responseId: validUUID,
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid responseId', () => {
    const result = webdevSandboxCreateSchema.safeParse({
      files: [{ path: 'a.ts', content: 'c' }],
      sessionId: validUUID,
      responseId: 'bad',
    });
    expect(result.success).toBe(false);
  });
});

describe('webdevSandboxDeleteSchema', () => {
  it('should accept valid sandboxId', () => {
    const result = webdevSandboxDeleteSchema.safeParse({
      sandboxId: 'sb_abc123',
    });
    expect(result.success).toBe(true);
  });

  it('should reject empty sandboxId', () => {
    const result = webdevSandboxDeleteSchema.safeParse({
      sandboxId: '',
    });
    expect(result.success).toBe(false);
  });

  it('should reject sandboxId exceeding 200 characters', () => {
    const result = webdevSandboxDeleteSchema.safeParse({
      sandboxId: 'x'.repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it('should trim sandboxId', () => {
    const result = webdevSandboxDeleteSchema.safeParse({
      sandboxId: '  sb_123  ',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sandboxId).toBe('sb_123');
    }
  });
});

describe('webdevConfigSchema', () => {
  it('should accept enabled config with vercel-sandbox', () => {
    const result = webdevConfigSchema.safeParse({
      enabled: true,
      provider: 'vercel-sandbox',
    });
    expect(result.success).toBe(true);
  });

  it('should accept disabled config with reason', () => {
    const result = webdevConfigSchema.safeParse({
      enabled: false,
      provider: 'disabled',
      reason: 'VERCEL_SANDBOX_NOT_CONFIGURED',
    });
    expect(result.success).toBe(true);
  });

  it('should accept config without reason', () => {
    const result = webdevConfigSchema.safeParse({
      enabled: false,
      provider: 'disabled',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid provider', () => {
    const result = webdevConfigSchema.safeParse({
      enabled: true,
      provider: 'invalid-provider',
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid reason', () => {
    const result = webdevConfigSchema.safeParse({
      enabled: false,
      provider: 'disabled',
      reason: 'UNKNOWN_REASON',
    });
    expect(result.success).toBe(false);
  });

  it('should reject missing enabled field', () => {
    const result = webdevConfigSchema.safeParse({
      provider: 'disabled',
    });
    expect(result.success).toBe(false);
  });

  it('should reject non-boolean enabled', () => {
    const result = webdevConfigSchema.safeParse({
      enabled: 'true',
      provider: 'disabled',
    });
    expect(result.success).toBe(false);
  });
});
