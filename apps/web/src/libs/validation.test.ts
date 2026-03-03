import { describe, expect, it } from 'vitest';
import {
  apiKeyPatchSchema,
  apiKeySchema,
  comparisonVoteSchema,
  connectionCheckSchema,
  conversationSchema,
  customModelSchema,
  customModelUpdateSchema,
  imageAttachmentSchema,
  maskApiKey,
  messageAttachmentSchema,
  messageSchema,
  modelAbilitiesSchema,
  modelEnableSchema,
  modelOverrideSchema,
  modelResponseSchema,
  responseAttachmentSchema,
  shareSchema,
  userPreferencesSchema,
  voteSchema,
  workflowStreamSchema,
} from './validation';

describe('validation', () => {
  describe('conversationSchema', () => {
    it('should accept valid title', () => {
      const result = conversationSchema.safeParse({ title: 'Test Conversation' });
      expect(result.success).toBe(true);
    });

    it('should trim whitespace from title', () => {
      const result = conversationSchema.safeParse({ title: '  Test  ' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Test');
      }
    });

    it('should reject empty title', () => {
      const result = conversationSchema.safeParse({ title: '' });
      expect(result.success).toBe(false);
    });

    it('should reject whitespace-only title', () => {
      const result = conversationSchema.safeParse({ title: '   ' });
      expect(result.success).toBe(false);
    });

    it('should reject title over 255 characters', () => {
      const result = conversationSchema.safeParse({ title: 'a'.repeat(256) });
      expect(result.success).toBe(false);
    });

    it('should accept title at exactly 255 characters', () => {
      const result = conversationSchema.safeParse({ title: 'a'.repeat(255) });
      expect(result.success).toBe(true);
    });
  });

  describe('messageAttachmentSchema', () => {
    const validAttachment = {
      type: 'image',
      fileId: '550e8400-e29b-41d4-a716-446655440000',
      mimeType: 'image/png',
    };

    it('should accept valid image attachment', () => {
      const result = messageAttachmentSchema.safeParse(validAttachment);
      expect(result.success).toBe(true);
    });

    it('should accept valid audio attachment', () => {
      const result = messageAttachmentSchema.safeParse({ ...validAttachment, type: 'audio' });
      expect(result.success).toBe(true);
    });

    it('should accept valid video attachment', () => {
      const result = messageAttachmentSchema.safeParse({ ...validAttachment, type: 'video' });
      expect(result.success).toBe(true);
    });

    it('should accept valid file attachment', () => {
      const result = messageAttachmentSchema.safeParse({ ...validAttachment, type: 'file' });
      expect(result.success).toBe(true);
    });

    it('should reject invalid type', () => {
      const result = messageAttachmentSchema.safeParse({ ...validAttachment, type: 'unknown' });
      expect(result.success).toBe(false);
    });

    it('should reject invalid UUID', () => {
      const result = messageAttachmentSchema.safeParse({ ...validAttachment, fileId: 'invalid' });
      expect(result.success).toBe(false);
    });

    it('should accept optional fields', () => {
      const result = messageAttachmentSchema.safeParse({
        ...validAttachment,
        filename: 'test.png',
        sizeBytes: 1024,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('messageSchema', () => {
    it('should accept valid user message', () => {
      const result = messageSchema.safeParse({ role: 'user', content: 'Hello' });
      expect(result.success).toBe(true);
    });

    it('should accept valid assistant message', () => {
      const result = messageSchema.safeParse({ role: 'assistant', content: 'Hi there' });
      expect(result.success).toBe(true);
    });

    it('should accept valid system message', () => {
      const result = messageSchema.safeParse({ role: 'system', content: 'You are helpful' });
      expect(result.success).toBe(true);
    });

    it('should reject invalid role', () => {
      const result = messageSchema.safeParse({ role: 'invalid', content: 'Hello' });
      expect(result.success).toBe(false);
    });

    it('should reject empty content', () => {
      const result = messageSchema.safeParse({ role: 'user', content: '' });
      expect(result.success).toBe(false);
    });

    it('should reject content over 50000 characters', () => {
      const result = messageSchema.safeParse({ role: 'user', content: 'a'.repeat(50001) });
      expect(result.success).toBe(false);
    });

    it('should accept content at exactly 50000 characters', () => {
      const result = messageSchema.safeParse({ role: 'user', content: 'a'.repeat(50000) });
      expect(result.success).toBe(true);
    });

    it('should accept message with attachments', () => {
      const result = messageSchema.safeParse({
        role: 'user',
        content: 'Hello',
        attachments: [
          { type: 'image', fileId: '550e8400-e29b-41d4-a716-446655440000', mimeType: 'image/png' },
        ],
      });
      expect(result.success).toBe(true);
    });

    it('should reject more than 10 attachments', () => {
      const attachments = Array(11)
        .fill(null)
        .map(() => ({
          type: 'image' as const,
          fileId: '550e8400-e29b-41d4-a716-446655440000',
          mimeType: 'image/png',
        }));
      const result = messageSchema.safeParse({ role: 'user', content: 'Hello', attachments });
      expect(result.success).toBe(false);
    });
  });

  describe('responseAttachmentSchema', () => {
    const validAttachment = {
      type: 'image',
      key: 'users/123/file.png',
      mimeType: 'image/png',
    };

    it('should accept valid image response attachment', () => {
      const result = responseAttachmentSchema.safeParse(validAttachment);
      expect(result.success).toBe(true);
    });

    it('should accept valid audio response attachment', () => {
      const result = responseAttachmentSchema.safeParse({ ...validAttachment, type: 'audio' });
      expect(result.success).toBe(true);
    });

    it('should accept valid video response attachment', () => {
      const result = responseAttachmentSchema.safeParse({ ...validAttachment, type: 'video' });
      expect(result.success).toBe(true);
    });

    it('should reject file type (not supported for responses)', () => {
      const result = responseAttachmentSchema.safeParse({ ...validAttachment, type: 'file' });
      expect(result.success).toBe(false);
    });
  });

  describe('modelResponseSchema', () => {
    const validResponse = {
      messageId: '550e8400-e29b-41d4-a716-446655440000',
      modelName: 'gpt-4',
      providerName: 'openai',
      responseContent: 'Hello, world!',
    };

    it('should accept valid model response', () => {
      const result = modelResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });

    it('should accept model response with optional fields', () => {
      const result = modelResponseSchema.safeParse({
        ...validResponse,
        tokensUsed: 100,
        responseTimeMs: 500,
        displayPosition: 0,
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid messageId', () => {
      const result = modelResponseSchema.safeParse({ ...validResponse, messageId: 'invalid' });
      expect(result.success).toBe(false);
    });

    it('should reject tokensUsed over 1000000', () => {
      const result = modelResponseSchema.safeParse({ ...validResponse, tokensUsed: 1000001 });
      expect(result.success).toBe(false);
    });
  });

  describe('voteSchema', () => {
    const validVote = {
      messageId: '550e8400-e29b-41d4-a716-446655440000',
      modelResponseId: '660e8400-e29b-41d4-a716-446655440001',
      voteType: 'like',
    };

    it('should accept valid like vote', () => {
      const result = voteSchema.safeParse(validVote);
      expect(result.success).toBe(true);
    });

    it('should accept valid dislike vote', () => {
      const result = voteSchema.safeParse({ ...validVote, voteType: 'dislike' });
      expect(result.success).toBe(true);
    });

    it('should accept valid neutral vote', () => {
      const result = voteSchema.safeParse({ ...validVote, voteType: 'neutral' });
      expect(result.success).toBe(true);
    });

    it('should reject invalid voteType', () => {
      const result = voteSchema.safeParse({ ...validVote, voteType: 'invalid' });
      expect(result.success).toBe(false);
    });
  });

  describe('comparisonVoteSchema', () => {
    const validComparisonVote = {
      messageId: '550e8400-e29b-41d4-a716-446655440000',
      voteType: 'winner',
      winnerId: '660e8400-e29b-41d4-a716-446655440001',
      comparisonType: 'text',
      participantIds: [
        '660e8400-e29b-41d4-a716-446655440001',
        '770e8400-e29b-41d4-a716-446655440002',
      ],
    };

    it('should accept valid winner vote', () => {
      const result = comparisonVoteSchema.safeParse(validComparisonVote);
      expect(result.success).toBe(true);
    });

    it('should accept valid tie vote without winnerId', () => {
      const { winnerId, ...tieVote } = validComparisonVote;
      const result = comparisonVoteSchema.safeParse({ ...tieVote, voteType: 'tie' });
      expect(result.success).toBe(true);
    });

    it('should accept valid all_bad vote without winnerId', () => {
      const { winnerId, ...allBadVote } = validComparisonVote;
      const result = comparisonVoteSchema.safeParse({ ...allBadVote, voteType: 'all_bad' });
      expect(result.success).toBe(true);
    });

    it('should reject winner vote without winnerId', () => {
      const { winnerId, ...invalidVote } = validComparisonVote;
      const result = comparisonVoteSchema.safeParse(invalidVote);
      expect(result.success).toBe(false);
    });

    it('should reject winner vote with winnerId not in participantIds', () => {
      const result = comparisonVoteSchema.safeParse({
        ...validComparisonVote,
        winnerId: '880e8400-e29b-41d4-a716-446655440003',
      });
      expect(result.success).toBe(false);
    });

    it('should reject fewer than 2 participants', () => {
      const result = comparisonVoteSchema.safeParse({
        ...validComparisonVote,
        participantIds: ['660e8400-e29b-41d4-a716-446655440001'],
      });
      expect(result.success).toBe(false);
    });

    it('should reject more than 5 participants', () => {
      const result = comparisonVoteSchema.safeParse({
        ...validComparisonVote,
        participantIds: [
          '660e8400-e29b-41d4-a716-446655440001',
          '770e8400-e29b-41d4-a716-446655440002',
          '880e8400-e29b-41d4-a716-446655440003',
          '990e8400-e29b-41d4-a716-446655440004',
          'aa0e8400-e29b-41d4-a716-446655440005',
          'bb0e8400-e29b-41d4-a716-446655440006',
        ],
      });
      expect(result.success).toBe(false);
    });

    it('should accept all comparison types', () => {
      const types = ['text', 'image_gen', 'video_gen', 'tts', 'stt'];
      for (const comparisonType of types) {
        const result = comparisonVoteSchema.safeParse({ ...validComparisonVote, comparisonType });
        expect(result.success).toBe(true);
      }
    });
  });

  describe('apiKeySchema', () => {
    it('should accept valid API key', () => {
      const result = apiKeySchema.safeParse({
        providerName: 'openai',
        apiKey: 'sk-1234567890',
      });
      expect(result.success).toBe(true);
    });

    it('should accept API key with valid proxyUrl', () => {
      const result = apiKeySchema.safeParse({
        providerName: 'openai',
        apiKey: 'sk-1234567890',
        proxyUrl: 'https://proxy.example.com',
      });
      expect(result.success).toBe(true);
    });

    it('should accept API key with http proxyUrl', () => {
      const result = apiKeySchema.safeParse({
        providerName: 'openai',
        apiKey: 'sk-1234567890',
        proxyUrl: 'http://localhost:8080',
      });
      expect(result.success).toBe(true);
    });

    it('should accept empty proxyUrl', () => {
      const result = apiKeySchema.safeParse({
        providerName: 'openai',
        apiKey: 'sk-1234567890',
        proxyUrl: '',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid proxyUrl', () => {
      const result = apiKeySchema.safeParse({
        providerName: 'openai',
        apiKey: 'sk-1234567890',
        proxyUrl: 'invalid-url',
      });
      expect(result.success).toBe(false);
    });

    it('should accept API key without apiKey field', () => {
      const result = apiKeySchema.safeParse({ providerName: 'openai' });
      expect(result.success).toBe(true);
    });
  });

  describe('apiKeyPatchSchema', () => {
    it('should accept enabled true', () => {
      const result = apiKeyPatchSchema.safeParse({ enabled: true });
      expect(result.success).toBe(true);
    });

    it('should accept enabled false', () => {
      const result = apiKeyPatchSchema.safeParse({ enabled: false });
      expect(result.success).toBe(true);
    });

    it('should accept empty object', () => {
      const result = apiKeyPatchSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe('connectionCheckSchema', () => {
    const validCheck = {
      providerName: 'openai',
      apiKey: 'sk-1234567890',
      model: 'gpt-4',
    };

    it('should accept valid connection check', () => {
      const result = connectionCheckSchema.safeParse(validCheck);
      expect(result.success).toBe(true);
    });

    it('should accept connection check with proxyUrl', () => {
      const result = connectionCheckSchema.safeParse({
        ...validCheck,
        proxyUrl: 'https://proxy.example.com',
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty apiKey', () => {
      const result = connectionCheckSchema.safeParse({ ...validCheck, apiKey: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('modelEnableSchema', () => {
    it('should accept valid model enable', () => {
      const result = modelEnableSchema.safeParse({
        models: [{ modelId: 'gpt-4', enabled: true }],
      });
      expect(result.success).toBe(true);
    });

    it('should accept multiple models', () => {
      const result = modelEnableSchema.safeParse({
        models: [
          { modelId: 'gpt-4', enabled: true },
          { modelId: 'gpt-3.5-turbo', enabled: false },
        ],
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty models array', () => {
      const result = modelEnableSchema.safeParse({ models: [] });
      expect(result.success).toBe(false);
    });

    it('should reject more than 100 models', () => {
      const models = Array(101)
        .fill(null)
        .map((_, i) => ({ modelId: `model-${i}`, enabled: true }));
      const result = modelEnableSchema.safeParse({ models });
      expect(result.success).toBe(false);
    });
  });

  describe('customModelSchema', () => {
    it('should accept valid custom model', () => {
      const result = customModelSchema.safeParse({ modelId: 'custom-model' });
      expect(result.success).toBe(true);
    });

    it('should accept custom model with displayName', () => {
      const result = customModelSchema.safeParse({
        modelId: 'custom-model',
        displayName: 'My Custom Model',
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty modelId', () => {
      const result = customModelSchema.safeParse({ modelId: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('modelAbilitiesSchema', () => {
    it('should accept all abilities', () => {
      const result = modelAbilitiesSchema.safeParse({
        files: true,
        functionCall: true,
        imageOutput: true,
        reasoning: true,
        search: true,
        structuredOutput: true,
        video: true,
        vision: true,
      });
      expect(result.success).toBe(true);
    });

    it('should accept empty object', () => {
      const result = modelAbilitiesSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should accept partial abilities', () => {
      const result = modelAbilitiesSchema.safeParse({ vision: true, search: false });
      expect(result.success).toBe(true);
    });
  });

  describe('modelOverrideSchema', () => {
    it('should accept valid model override', () => {
      const result = modelOverrideSchema.safeParse({ modelId: 'gpt-4' });
      expect(result.success).toBe(true);
    });

    it('should accept model override with all fields', () => {
      const result = modelOverrideSchema.safeParse({
        modelId: 'gpt-4',
        displayName: 'GPT-4 Custom',
        groupName: 'OpenAI',
        abilities: { vision: true },
        supportsStreaming: true,
        priceCurrency: 'USD',
        inputPrice: 0.01,
        outputPrice: 0.03,
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid priceCurrency', () => {
      const result = modelOverrideSchema.safeParse({
        modelId: 'gpt-4',
        priceCurrency: 'EUR',
      });
      expect(result.success).toBe(false);
    });

    it('should reject negative prices', () => {
      const result = modelOverrideSchema.safeParse({
        modelId: 'gpt-4',
        inputPrice: -1,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('customModelUpdateSchema', () => {
    it('should accept valid update', () => {
      const result = customModelUpdateSchema.safeParse({ displayName: 'New Name' });
      expect(result.success).toBe(true);
    });

    it('should accept empty object', () => {
      const result = customModelUpdateSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe('userPreferencesSchema', () => {
    it('should accept valid preferences', () => {
      const result = userPreferencesSchema.safeParse({
        theme: 'dark',
        language: 'en',
        defaultModels: ['gpt-4'],
        configSource: 'manual',
      });
      expect(result.success).toBe(true);
    });

    it('should accept empty object', () => {
      const result = userPreferencesSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should accept all configSource values', () => {
      for (const configSource of ['manual', 'cherry-studio', 'newapi']) {
        const result = userPreferencesSchema.safeParse({ configSource });
        expect(result.success).toBe(true);
      }
    });

    it('should reject more than 10 default models', () => {
      const result = userPreferencesSchema.safeParse({
        defaultModels: Array(11).fill('gpt-4'),
      });
      expect(result.success).toBe(false);
    });
  });

  describe('shareSchema', () => {
    it('should accept valid expiresInDays', () => {
      const result = shareSchema.safeParse({ expiresInDays: 7 });
      expect(result.success).toBe(true);
    });

    it('should accept empty object', () => {
      const result = shareSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should reject expiresInDays less than 1', () => {
      const result = shareSchema.safeParse({ expiresInDays: 0 });
      expect(result.success).toBe(false);
    });

    it('should reject expiresInDays more than 365', () => {
      const result = shareSchema.safeParse({ expiresInDays: 366 });
      expect(result.success).toBe(false);
    });
  });

  describe('imageAttachmentSchema', () => {
    it('should accept valid image attachment', () => {
      const result = imageAttachmentSchema.safeParse({
        type: 'image',
        data: 'base64data',
        mediaType: 'image/png',
      });
      expect(result.success).toBe(true);
    });

    it('should reject non-image type', () => {
      const result = imageAttachmentSchema.safeParse({
        type: 'video',
        data: 'base64data',
        mediaType: 'video/mp4',
      });
      expect(result.success).toBe(false);
    });

    it('should accept optional filename', () => {
      const result = imageAttachmentSchema.safeParse({
        type: 'image',
        data: 'base64data',
        mediaType: 'image/png',
        filename: 'test.png',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('workflowStreamSchema', () => {
    const validWorkflow = {
      workflowId: '550e8400-e29b-41d4-a716-446655440000',
      modelId: 'gpt-4',
      keyId: '660e8400-e29b-41d4-a716-446655440001',
      messages: [{ role: 'user', content: 'Hello' }],
      config: { temperature: 0.7, maxTokens: 2048 },
    };

    it('should accept valid workflow stream', () => {
      const result = workflowStreamSchema.safeParse(validWorkflow);
      expect(result.success).toBe(true);
    });

    it('should reject invalid workflowId', () => {
      const result = workflowStreamSchema.safeParse({ ...validWorkflow, workflowId: 'invalid' });
      expect(result.success).toBe(false);
    });

    it('should reject empty modelId', () => {
      const result = workflowStreamSchema.safeParse({ ...validWorkflow, modelId: '' });
      expect(result.success).toBe(false);
    });

    it('should reject whitespace-only modelId', () => {
      const result = workflowStreamSchema.safeParse({ ...validWorkflow, modelId: '   ' });
      expect(result.success).toBe(false);
    });

    it('should reject empty messages array', () => {
      const result = workflowStreamSchema.safeParse({ ...validWorkflow, messages: [] });
      expect(result.success).toBe(false);
    });

    it('should reject more than 100 messages', () => {
      const messages = Array(101)
        .fill(null)
        .map(() => ({ role: 'user' as const, content: 'Hello' }));
      const result = workflowStreamSchema.safeParse({ ...validWorkflow, messages });
      expect(result.success).toBe(false);
    });

    it('should accept workflow with attachments', () => {
      const result = workflowStreamSchema.safeParse({
        ...validWorkflow,
        attachments: [{ type: 'image', data: 'base64', mediaType: 'image/png' }],
      });
      expect(result.success).toBe(true);
    });

    it('should accept config with optional fields', () => {
      const result = workflowStreamSchema.safeParse({
        ...validWorkflow,
        config: {
          temperature: 0.5,
          maxTokens: 1000,
          topP: 0.9,
          frequencyPenalty: 0.5,
          presencePenalty: 0.5,
        },
      });
      expect(result.success).toBe(true);
    });

    it('should reject temperature out of range', () => {
      const result = workflowStreamSchema.safeParse({
        ...validWorkflow,
        config: { ...validWorkflow.config, temperature: 3 },
      });
      expect(result.success).toBe(false);
    });
  });

  describe('maskApiKey', () => {
    it('should mask short keys (<=8 chars) entirely', () => {
      expect(maskApiKey('short')).toBe('*****');
      expect(maskApiKey('12345678')).toBe('********');
    });

    it('should show first and last 4 chars for longer keys', () => {
      // 'sk-1234567890abcdef' is 18 chars, so middle = 18 - 8 = 10 asterisks
      const result = maskApiKey('sk-1234567890abcdef');
      expect(result.startsWith('sk-1')).toBe(true);
      expect(result.endsWith('cdef')).toBe(true);
      expect(result).not.toContain('234567890abc');
    });

    it('should limit masked middle to 20 asterisks', () => {
      const longKey = `sk-1${'x'.repeat(100)}cdef`;
      const masked = maskApiKey(longKey);
      expect(masked).toBe('sk-1********************cdef');
      expect(masked.length).toBe(28); // 4 + 20 + 4
    });

    it('should handle 9 character key', () => {
      expect(maskApiKey('123456789')).toBe('1234*6789');
    });

    it('should handle empty string', () => {
      expect(maskApiKey('')).toBe('');
    });
  });
});
