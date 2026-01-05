import type { ModelAbilities } from '@lmring/model-depot';

export interface ModelOption {
  id: string;
  name: string;
  provider: string;
  providerId: string;
  description?: string;
  category?: string;
  context?: string;
  inputPricing?: string;
  outputPricing?: string;
  type?: 'hobby' | 'pro';
  isPremium?: boolean;
  isNew?: boolean;
  isCustom?: boolean;
  default?: boolean;
  abilities?: ModelAbilities;
}

export interface ModelConfig {
  maxTokens: number;
  temperature: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

export const DEFAULT_MODEL_CONFIG: ModelConfig = {
  maxTokens: 2048,
  temperature: 0.7,
};

export interface ModelComparison {
  id: string;
  modelId: string;
  response: string;
  responseTime?: number;
  tokenCount?: number;
  isLoading: boolean;
  synced: boolean;
  customPrompt: string;
  config: ModelConfig;
  error?: string;
}
