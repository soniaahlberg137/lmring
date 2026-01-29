import { z } from 'zod';

export type ModelPriceCurrency = 'CNY' | 'USD';

export const AiModelSourceEnum = {
  Builtin: 'builtin',
  Custom: 'custom',
  Remote: 'remote',
} as const;

export type AiModelSourceType = (typeof AiModelSourceEnum)[keyof typeof AiModelSourceEnum];

export const AiModelTypeSchema = z.enum([
  'chat',
  'embedding',
  'tts',
  'stt',
  'image',
  'video',
  'realtime',
] as const);

export type AiModelType = z.infer<typeof AiModelTypeSchema>;

export interface ModelAbilities {
  files?: boolean;
  functionCall?: boolean;
  imageOutput?: boolean;
  reasoning?: boolean;
  search?: boolean;
  structuredOutput?: boolean;
  video?: boolean;
  videoOutput?: boolean;
  vision?: boolean;
}

export const ModelAbilitiesSchema = z.object({
  files: z.boolean().optional(),
  functionCall: z.boolean().optional(),
  imageOutput: z.boolean().optional(),
  reasoning: z.boolean().optional(),
  search: z.boolean().optional(),
  structuredOutput: z.boolean().optional(),
  video: z.boolean().optional(),
  videoOutput: z.boolean().optional(),
  vision: z.boolean().optional(),
});

export interface ModelPricing {
  currency?: ModelPriceCurrency;
  input?: number;
  output?: number;
  cachedInput?: number;
}

export interface BaseModelCard {
  id: string;
  displayName?: string;
  description?: string;
  contextWindowTokens?: number;
  maxOutput?: number;
  enabled?: boolean;
  releasedAt?: string;
  legacy?: boolean;
  organization?: string;
}

export interface ModelSettings {
  searchImpl?: 'internal' | 'external';
}

export interface ChatModelCard extends BaseModelCard {
  type: 'chat';
  abilities?: ModelAbilities;
  pricing?: ModelPricing;
  settings?: ModelSettings;
}

export interface EmbeddingModelCard extends BaseModelCard {
  type: 'embedding';
  maxDimension: number;
  pricing?: ModelPricing;
}

export interface ImageModelCard extends BaseModelCard {
  type: 'image';
  resolutions?: string[];
  pricing?: ModelPricing;
}

export interface TTSModelCard extends BaseModelCard {
  type: 'tts';
  pricing?: ModelPricing;
}

export interface STTModelCard extends BaseModelCard {
  type: 'stt';
  pricing?: ModelPricing;
}

export interface RealtimeModelCard extends BaseModelCard {
  type: 'realtime';
  abilities?: Pick<ModelAbilities, 'functionCall' | 'vision' | 'reasoning' | 'files'>;
  pricing?: ModelPricing;
}

export interface VideoModelCard extends BaseModelCard {
  type: 'video';
  maxDurationSeconds?: number;
  resolutions?: string[];
  fps?: number;
  pricing?: ModelPricing;
  runtimeProvider?: string;
}

export type AnyModelCard =
  | ChatModelCard
  | EmbeddingModelCard
  | ImageModelCard
  | TTSModelCard
  | STTModelCard
  | RealtimeModelCard
  | VideoModelCard;

export interface FullModelCard extends BaseModelCard {
  type: AiModelType;
  abilities?: ModelAbilities;
  pricing?: ModelPricing;
  maxDimension?: number;
  resolutions?: string[];
  runtimeProvider?: string;
}

export interface DefaultModelListItem extends FullModelCard {
  providerId: string;
  source: AiModelSourceType;
  abilities: ModelAbilities;
}

export const CreateModelSchema = z.object({
  id: z.string(),
  providerId: z.string(),
  displayName: z.string().optional(),
  description: z.string().optional(),
  contextWindowTokens: z.number().optional(),
  maxOutput: z.number().optional(),
  type: AiModelTypeSchema.optional(),
  abilities: ModelAbilitiesSchema.optional(),
  releasedAt: z.string().optional(),
});

export type CreateModelParams = z.infer<typeof CreateModelSchema>;

export interface ProviderModelListItem {
  id: string;
  displayName?: string;
  description?: string;
  contextWindowTokens?: number;
  maxOutput?: number;
  enabled: boolean;
  type: AiModelType;
  abilities?: ModelAbilities;
  pricing?: ModelPricing;
  source?: AiModelSourceType;
  releasedAt?: string;
}

// Model override - user customizations for default or custom models
export interface ModelOverride {
  modelId: string;
  displayName?: string;
  groupName?: string;
  abilities?: ModelAbilities;
  supportsStreaming?: boolean;
  priceCurrency?: ModelPriceCurrency;
  inputPrice?: number;
  outputPrice?: number;
}

export const ModelOverrideSchema = z.object({
  modelId: z.string(),
  displayName: z.string().optional(),
  groupName: z.string().optional(),
  abilities: ModelAbilitiesSchema.optional(),
  supportsStreaming: z.boolean().optional(),
  priceCurrency: z.enum(['USD', 'CNY']).optional(),
  inputPrice: z.number().optional(),
  outputPrice: z.number().optional(),
});

export type ModelOverrideParams = z.infer<typeof ModelOverrideSchema>;
