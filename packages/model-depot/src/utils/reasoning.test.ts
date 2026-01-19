import { describe, expect, it } from 'vitest';
import { detectReasoningByModelId } from './reasoning';

describe('detectReasoningByModelId', () => {
  describe('Claude reasoning models', () => {
    it('detects claude-3.7', () => {
      expect(detectReasoningByModelId('claude-3.7-sonnet')).toBe(true);
      expect(detectReasoningByModelId('claude-3-7-haiku')).toBe(true);
    });

    it('detects claude 4 models', () => {
      expect(detectReasoningByModelId('claude-sonnet-4')).toBe(true);
      expect(detectReasoningByModelId('claude-opus-4')).toBe(true);
      expect(detectReasoningByModelId('claude-haiku-4')).toBe(true);
    });
  });

  describe('OpenAI reasoning models', () => {
    it('detects o1/o3/o4 series', () => {
      expect(detectReasoningByModelId('o1-preview')).toBe(true);
      expect(detectReasoningByModelId('o1-mini')).toBe(true);
      expect(detectReasoningByModelId('o3-mini')).toBe(true);
      expect(detectReasoningByModelId('o4')).toBe(true);
    });

    it('detects gpt-5', () => {
      expect(detectReasoningByModelId('gpt-5')).toBe(true);
      expect(detectReasoningByModelId('gpt-5-turbo')).toBe(true);
    });

    it('detects gpt-oss', () => {
      expect(detectReasoningByModelId('gpt-oss')).toBe(true);
    });
  });

  describe('Qwen reasoning models', () => {
    it('detects qwen3/qwq/qvq', () => {
      expect(detectReasoningByModelId('qwen3-72b')).toBe(true);
      expect(detectReasoningByModelId('qwq-32b')).toBe(true);
      expect(detectReasoningByModelId('qvq-72b')).toBe(true);
    });
  });

  describe('Gemini reasoning models', () => {
    it('detects gemini thinking models', () => {
      expect(detectReasoningByModelId('gemini-2.0-flash-thinking')).toBe(true);
    });

    it('detects gemini 2.5', () => {
      expect(detectReasoningByModelId('gemini-2.5-pro')).toBe(true);
      expect(detectReasoningByModelId('gemini-2.5-flash')).toBe(true);
    });
  });

  describe('DeepSeek reasoning models', () => {
    it('detects deepseek v3.x', () => {
      expect(detectReasoningByModelId('deepseek-v3.1')).toBe(true);
      expect(detectReasoningByModelId('deepseek-v3-5')).toBe(true);
      expect(detectReasoningByModelId('deepseek-chat-v3')).toBe(true);
    });
  });

  describe('Grok reasoning models', () => {
    it('detects grok reasoning models', () => {
      expect(detectReasoningByModelId('grok-3-mini')).toBe(true);
      expect(detectReasoningByModelId('grok-4')).toBe(true);
    });
  });

  describe('Chinese provider reasoning models', () => {
    it('detects hunyuan reasoning', () => {
      expect(detectReasoningByModelId('hunyuan-t1')).toBe(true);
      expect(detectReasoningByModelId('hunyuan-a13b')).toBe(true);
    });

    it('detects zhipu reasoning', () => {
      expect(detectReasoningByModelId('glm-z1')).toBe(true);
      expect(detectReasoningByModelId('glm-4.5-pro')).toBe(true);
      expect(detectReasoningByModelId('glm-4.6')).toBe(true);
    });

    it('detects minimax reasoning', () => {
      expect(detectReasoningByModelId('minimax-m1')).toBe(true);
      expect(detectReasoningByModelId('minimax-m2')).toBe(true);
    });

    it('detects step reasoning', () => {
      expect(detectReasoningByModelId('step-3')).toBe(true);
      expect(detectReasoningByModelId('step-r1')).toBe(true);
    });
  });

  describe('Generic reasoning keywords', () => {
    it('detects reasoning keyword', () => {
      expect(detectReasoningByModelId('custom-reasoning-model')).toBe(true);
      expect(detectReasoningByModelId('my-reasoner')).toBe(true);
      expect(detectReasoningByModelId('thinking-model')).toBe(true);
    });
  });

  describe('Non-reasoning models', () => {
    it('returns false for regular models', () => {
      expect(detectReasoningByModelId('gpt-4o')).toBe(false);
      expect(detectReasoningByModelId('gpt-4-turbo')).toBe(false);
      expect(detectReasoningByModelId('claude-3-sonnet')).toBe(false);
      expect(detectReasoningByModelId('claude-3.5-sonnet')).toBe(false);
      expect(detectReasoningByModelId('gemini-1.5-pro')).toBe(false);
      expect(detectReasoningByModelId('llama-3.1-70b')).toBe(false);
      expect(detectReasoningByModelId('qwen2.5-72b')).toBe(false);
      expect(detectReasoningByModelId('deepseek-v2')).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(detectReasoningByModelId('')).toBe(false);
    });
  });
});
