import { z } from 'zod';

export const conversationSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(255, 'Title must be less than 255 characters'),
});

export const messageAttachmentSchema = z.object({
  type: z.enum(['image', 'audio', 'video', 'file']),
  fileId: z.uuid('Invalid file ID'),
  mimeType: z.string().min(1).max(100),
  filename: z.string().max(255).optional(),
  sizeBytes: z.number().int().positive().optional(),
});

export const messageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z
    .string()
    .trim()
    .min(1, 'Content is required')
    .max(50000, 'Content must be less than 50000 characters'),
  attachments: z.array(messageAttachmentSchema).max(10).optional(),
});

export const responseAttachmentSchema = z.object({
  type: z.enum(['image', 'audio', 'video']),
  key: z.string().min(1).max(500),
  mimeType: z.string().min(1).max(100),
  filename: z.string().max(255).optional(),
  sizeBytes: z.number().int().positive().optional(),
});

export const modelResponseSchema = z.object({
  messageId: z.uuid('Invalid message ID'),
  modelName: z.string().min(1).max(100),
  providerName: z.string().min(1).max(100),
  responseContent: z.string().trim().min(1).max(50000),
  attachments: z.array(responseAttachmentSchema).max(20).optional(),
  tokensUsed: z.number().int().min(0).max(1000000).optional(),
  responseTimeMs: z.number().int().min(0).max(3600000).optional(),
  displayPosition: z.number().int().min(0).max(10).optional(),
});

export const voteSchema = z.object({
  messageId: z.uuid('Invalid message ID'),
  modelResponseId: z.uuid('Invalid model response ID'),
  voteType: z.enum(['like', 'dislike', 'neutral']),
});

export const comparisonVoteSchema = z
  .object({
    messageId: z.uuid('Invalid message ID'),
    voteType: z.enum(['winner', 'tie', 'all_bad']),
    winnerId: z.uuid('Invalid winner model response ID').optional(),
    comparisonType: z.enum(['text', 'image_gen', 'video_gen', 'tts', 'stt']),
    participantIds: z
      .array(z.uuid('Invalid participant model response ID'))
      .min(2, 'At least 2 participants required')
      .max(5, 'Maximum 5 participants allowed'),
  })
  .refine((data) => data.voteType !== 'winner' || data.winnerId !== undefined, {
    message: 'winnerId is required when voteType is winner',
    path: ['winnerId'],
  })
  .refine(
    (data) =>
      data.voteType !== 'winner' ||
      (data.winnerId !== undefined && data.participantIds.includes(data.winnerId)),
    {
      message: 'winnerId must be one of the participantIds',
      path: ['winnerId'],
    },
  );

export const apiKeySchema = z.object({
  providerName: z.string().min(1).max(100),
  apiKey: z.string().min(1).max(500).optional(),
  proxyUrl: z
    .string()
    .max(500)
    .refine(
      (val) => val === '' || /^https?:\/\/.+/.test(val),
      'Must be a valid URL starting with http:// or https://',
    )
    .optional(),
  enabled: z.boolean().optional(),
  isCustom: z.boolean().optional(),
  providerType: z.string().max(100).optional(),
});

export const apiKeyPatchSchema = z.object({
  enabled: z.boolean().optional(),
});

export const connectionCheckSchema = z.object({
  providerName: z.string().min(1).max(100),
  providerType: z.string().min(1).max(100).optional(),
  apiKey: z.string().min(1).max(500),
  proxyUrl: z
    .string()
    .max(500)
    .refine(
      (val) => val === '' || /^https?:\/\/.+/.test(val),
      'Must be a valid URL starting with http:// or https://',
    )
    .optional(),
  model: z.string().min(1).max(200),
});

export const modelEnableSchema = z.object({
  models: z
    .array(
      z.object({
        modelId: z.string().min(1).max(200),
        enabled: z.boolean(),
      }),
    )
    .min(1)
    .max(100),
});

export const customModelSchema = z.object({
  modelId: z.string().min(1).max(200),
  displayName: z.string().max(200).optional(),
});

export const modelAbilitiesSchema = z.object({
  files: z.boolean().optional(),
  functionCall: z.boolean().optional(),
  imageOutput: z.boolean().optional(),
  reasoning: z.boolean().optional(),
  search: z.boolean().optional(),
  structuredOutput: z.boolean().optional(),
  video: z.boolean().optional(),
  vision: z.boolean().optional(),
});

export const modelOverrideSchema = z.object({
  modelId: z.string().min(1).max(200),
  displayName: z.string().max(200).optional(),
  groupName: z.string().max(100).optional(),
  abilities: modelAbilitiesSchema.optional(),
  supportsStreaming: z.boolean().optional(),
  priceCurrency: z.enum(['USD', 'CNY']).optional(),
  inputPrice: z.number().min(0).max(1000).optional(),
  outputPrice: z.number().min(0).max(1000).optional(),
});

export const customModelUpdateSchema = z.object({
  displayName: z.string().max(200).optional(),
  groupName: z.string().max(100).optional(),
  abilities: modelAbilitiesSchema.optional(),
  supportsStreaming: z.boolean().optional(),
  priceCurrency: z.enum(['USD', 'CNY']).optional(),
  inputPrice: z.number().min(0).max(1000).optional(),
  outputPrice: z.number().min(0).max(1000).optional(),
});

export const userPreferencesSchema = z.object({
  theme: z.string().max(50).optional(),
  language: z.string().max(10).optional(),
  defaultModels: z.array(z.string().max(100)).max(10).optional(),
  configSource: z.enum(['manual', 'cherry-studio', 'newapi']).optional(),
});

export const themeConfigSchema = z.object({
  mode: z.enum(['light', 'dark', 'system']),
  seedColor: z.object({
    l: z.number().min(0).max(1),
    c: z.number().min(0).max(0.4),
    h: z.number().min(0).max(360),
  }),
  presetName: z.string().max(100).nullable(),
});

export const shareSchema = z.object({
  expiresInDays: z.number().int().min(1).max(365).optional(),
});

export const imageAttachmentSchema = z.object({
  type: z.literal('image'),
  data: z.string().min(1),
  mediaType: z.string().min(1).max(100),
  filename: z.string().max(255).optional(),
});

export const workflowStreamSchema = z.object({
  workflowId: z.uuid('Invalid workflow ID'),
  modelId: z
    .string()
    .min(1)
    .max(200)
    .refine((val) => val.trim().length > 0, {
      message: 'Model ID cannot be empty or whitespace only',
    }),
  keyId: z.uuid('Invalid API key ID'),
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string().trim().min(1).max(50000),
      }),
    )
    .min(1)
    .max(100),
  config: z.object({
    temperature: z.number().min(0).max(2).default(0.7),
    maxTokens: z.number().int().min(1).max(100000).default(2048),
    topP: z.number().min(0).max(1).optional(),
    frequencyPenalty: z.number().min(-2).max(2).optional(),
    presencePenalty: z.number().min(-2).max(2).optional(),
  }),
  attachments: z.array(imageAttachmentSchema).max(10).optional(),
});

export type ConversationInput = z.infer<typeof conversationSchema>;
export type MessageInput = z.infer<typeof messageSchema>;
export type MessageAttachmentInput = z.infer<typeof messageAttachmentSchema>;
export type ResponseAttachmentInput = z.infer<typeof responseAttachmentSchema>;
export type ModelResponseInput = z.infer<typeof modelResponseSchema>;
export type VoteInput = z.infer<typeof voteSchema>;
export type ComparisonVoteInput = z.infer<typeof comparisonVoteSchema>;
export type ApiKeyInput = z.infer<typeof apiKeySchema>;
export type ApiKeyPatchInput = z.infer<typeof apiKeyPatchSchema>;
export type ConnectionCheckInput = z.infer<typeof connectionCheckSchema>;
export type ModelEnableInput = z.infer<typeof modelEnableSchema>;
export type CustomModelInput = z.infer<typeof customModelSchema>;
export type UserPreferencesInput = z.infer<typeof userPreferencesSchema>;
export type ThemeConfigInput = z.infer<typeof themeConfigSchema>;
export type ShareInput = z.infer<typeof shareSchema>;
export type ImageAttachmentInput = z.infer<typeof imageAttachmentSchema>;
export type WorkflowStreamInput = z.infer<typeof workflowStreamSchema>;
export type ModelAbilitiesInput = z.infer<typeof modelAbilitiesSchema>;
export type ModelOverrideInput = z.infer<typeof modelOverrideSchema>;
export type CustomModelUpdateInput = z.infer<typeof customModelUpdateSchema>;

export function maskApiKey(apiKey: string): string {
  if (apiKey.length <= 8) {
    return '*'.repeat(apiKey.length);
  }

  const visibleStart = apiKey.slice(0, 4);
  const visibleEnd = apiKey.slice(-4);
  const maskedMiddle = '*'.repeat(Math.min(apiKey.length - 8, 20));

  return `${visibleStart}${maskedMiddle}${visibleEnd}`;
}
