import { describe, expect, it } from 'vitest';
import type { WorkflowConfig } from './workflow';
import { DEFAULT_WORKFLOW_CONFIG } from './workflow';

describe('DEFAULT_WORKFLOW_CONFIG', () => {
  it('should have correct temperature value', () => {
    expect(DEFAULT_WORKFLOW_CONFIG.temperature).toBe(0.7);
  });

  it('should have correct maxTokens value', () => {
    expect(DEFAULT_WORKFLOW_CONFIG.maxTokens).toBe(2048);
  });

  it('should conform to WorkflowConfig type', () => {
    const config: WorkflowConfig = DEFAULT_WORKFLOW_CONFIG;
    expect(config).toEqual({
      temperature: 0.7,
      maxTokens: 2048,
    });
  });
});
