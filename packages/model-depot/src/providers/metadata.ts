import type { ProviderMetadata } from './types';

/**
 * Official SDK provider metadata
 * These providers have dedicated AI SDK packages
 */
export const OFFICIAL_PROVIDER_METADATA: ProviderMetadata[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    type: 'official',
    supportsStreaming: true,
    supportsStructuredOutput: true,
    supportsVision: true,
    supportsFunctionCalling: true,
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    type: 'official',
    supportsStreaming: true,
    supportsStructuredOutput: true,
    supportsVision: true,
    supportsFunctionCalling: true,
  },
  {
    id: 'azure',
    name: 'Azure OpenAI',
    type: 'official',
    supportsStreaming: true,
    supportsStructuredOutput: true,
    supportsVision: true,
    supportsFunctionCalling: true,
  },
  {
    id: 'vertex',
    name: 'Vertex AI',
    type: 'official',
    supportsStreaming: true,
    supportsStructuredOutput: true,
    supportsVision: true,
    supportsFunctionCalling: true,
  },
  {
    id: 'xai',
    name: 'xAI',
    type: 'official',
    supportsStreaming: true,
    supportsStructuredOutput: true,
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    type: 'official',
    supportsStreaming: true,
    supportsStructuredOutput: true,
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    type: 'official',
    supportsStreaming: true,
    supportsStructuredOutput: true,
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    type: 'official',
    supportsStreaming: true,
    supportsStructuredOutput: true,
    supportsVision: true,
    supportsFunctionCalling: true,
  },
  {
    id: 'google',
    name: 'Google AI',
    type: 'official',
    supportsStreaming: true,
    supportsStructuredOutput: true,
    supportsVision: true,
    supportsFunctionCalling: true,
  },
  {
    id: 'bedrock',
    name: 'Amazon Bedrock',
    type: 'official',
    supportsStreaming: true,
    supportsStructuredOutput: true,
    supportsVision: true,
    supportsFunctionCalling: true,
  },
  {
    id: 'ollama',
    name: 'Ollama',
    type: 'official',
    supportsStreaming: true,
    supportsStructuredOutput: true,
    supportsVision: true,
    supportsFunctionCalling: true,
  },
];

/**
 * Compatible provider metadata
 * These providers use OpenAI-compatible API format
 */
export const COMPATIBLE_PROVIDER_METADATA: ProviderMetadata[] = [
  // International Compatible Providers
  {
    id: 'groq',
    name: 'Groq',
    type: 'compatible',
    supportsStreaming: true,
    supportsStructuredOutput: true,
    supportsVision: true,
    supportsFunctionCalling: true,
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    type: 'compatible',
    supportsStreaming: true,
    supportsStructuredOutput: true,
    supportsVision: true,
  },
  {
    id: 'cohere',
    name: 'Cohere',
    type: 'compatible',
    supportsStreaming: true,
    supportsStructuredOutput: true,
    supportsVision: true,
    supportsFunctionCalling: true,
  },
  {
    id: 'togetherai',
    name: 'Together AI',
    type: 'compatible',
    supportsStreaming: true,
    supportsStructuredOutput: true,
    supportsVision: true,
    supportsFunctionCalling: true,
  },
  {
    id: 'fireworksai',
    name: 'Fireworks AI',
    type: 'compatible',
    supportsStreaming: true,
    supportsStructuredOutput: true,
    supportsVision: true,
    supportsFunctionCalling: true,
  },
  {
    id: 'sambanova',
    name: 'SambaNova',
    type: 'compatible',
    supportsStreaming: true,
    supportsStructuredOutput: true,
    supportsVision: true,
    supportsFunctionCalling: true,
  },
  {
    id: 'github',
    name: 'GitHub Models',
    type: 'compatible',
    supportsStreaming: true,
    supportsStructuredOutput: true,
    supportsVision: true,
    supportsFunctionCalling: true,
  },
  {
    id: 'huggingface',
    name: 'Hugging Face',
    type: 'compatible',
    supportsStreaming: true,
    supportsStructuredOutput: true,
    supportsVision: true,
    supportsFunctionCalling: true,
  },
  {
    id: 'nvidia',
    name: 'NVIDIA',
    type: 'compatible',
    supportsStreaming: true,
    supportsStructuredOutput: true,
    supportsVision: true,
    supportsFunctionCalling: true,
  },
  {
    id: 'cerebras',
    name: 'Cerebras',
    type: 'compatible',
    supportsStreaming: true,
    supportsStructuredOutput: true,
    supportsFunctionCalling: true,
  },
  {
    id: 'cloudflare',
    name: 'Cloudflare Workers AI',
    type: 'compatible',
    supportsStreaming: true,
    supportsStructuredOutput: true,
  },
  {
    id: 'nebius',
    name: 'Nebius AI Studio',
    type: 'compatible',
    supportsStreaming: true,
    supportsStructuredOutput: true,
    supportsVision: true,
    supportsFunctionCalling: true,
  },
  {
    id: 'upstage',
    name: 'Upstage',
    type: 'compatible',
    supportsStreaming: true,
    supportsStructuredOutput: true,
    supportsFunctionCalling: true,
  },
  {
    id: 'novita',
    name: 'Novita AI',
    type: 'compatible',
    supportsStreaming: true,
    supportsStructuredOutput: true,
    supportsVision: true,
    supportsFunctionCalling: true,
  },
  {
    id: 'ai21',
    name: 'AI21 Labs',
    type: 'compatible',
    supportsStreaming: true,
    supportsStructuredOutput: true,
  },
  {
    id: 'bfl',
    name: 'Black Forest Labs',
    type: 'compatible',
    supportsStreaming: false,
    supportsStructuredOutput: false,
  },
  {
    id: 'infiniai',
    name: 'InfiniAI',
    type: 'compatible',
    supportsStreaming: true,
    supportsStructuredOutput: true,
    supportsFunctionCalling: true,
  },
  {
    id: 'jina',
    name: 'Jina AI',
    type: 'compatible',
    supportsStreaming: true,
    supportsStructuredOutput: true,
  },
  {
    id: 'search1api',
    name: 'Search1API',
    type: 'compatible',
    supportsStreaming: true,
    supportsStructuredOutput: true,
  },
  {
    id: 'fal',
    name: 'fal',
    type: 'compatible',
    supportsStreaming: false,
    supportsStructuredOutput: false,
  },

  // Chinese/Domestic Providers
  {
    id: 'silicon',
    name: 'SiliconFlow',
    type: 'compatible',
    supportsStreaming: true,
    supportsStructuredOutput: true,
    supportsVision: true,
  },
  {
    id: 'dashscope',
    name: 'Aliyun Bailian',
    type: 'compatible',
    supportsStreaming: true,
    supportsStructuredOutput: true,
    supportsVision: true,
  },
  {
    id: 'zhipu',
    name: 'Zhipu AI',
    type: 'compatible',
    supportsStreaming: true,
    supportsStructuredOutput: true,
    supportsVision: true,
  },
  {
    id: 'baichuan',
    name: 'Baichuan AI',
    type: 'compatible',
    supportsStreaming: true,
    supportsStructuredOutput: true,
  },
  {
    id: 'moonshot',
    name: 'Moonshot AI',
    type: 'compatible',
    supportsStreaming: true,
    supportsStructuredOutput: true,
  },
  {
    id: 'yi',
    name: '01.AI (Yi)',
    type: 'compatible',
    supportsStreaming: true,
    supportsStructuredOutput: true,
    supportsVision: true,
  },
  {
    id: 'minimax',
    name: 'MiniMax',
    type: 'compatible',
    supportsStreaming: true,
    supportsStructuredOutput: true,
  },
  {
    id: 'step',
    name: 'StepFun',
    type: 'compatible',
    supportsStreaming: true,
    supportsStructuredOutput: true,
    supportsVision: true,
  },
  {
    id: 'hunyuan',
    name: 'Tencent Hunyuan',
    type: 'compatible',
    supportsStreaming: true,
    supportsStructuredOutput: true,
    supportsVision: true,
    supportsFunctionCalling: true,
  },
  {
    id: 'spark',
    name: 'iFlytek Spark',
    type: 'compatible',
    supportsStreaming: true,
    supportsStructuredOutput: true,
    supportsFunctionCalling: true,
  },
  {
    id: 'volcengine',
    name: 'Volcengine Doubao',
    type: 'compatible',
    supportsStreaming: true,
    supportsStructuredOutput: true,
    supportsVision: true,
    supportsFunctionCalling: true,
  },
  {
    id: 'wenxin',
    name: 'Baidu Wenxin',
    type: 'compatible',
    supportsStreaming: true,
    supportsStructuredOutput: true,
    supportsVision: true,
    supportsFunctionCalling: true,
  },
  {
    id: 'sensenova',
    name: 'SenseNova',
    type: 'compatible',
    supportsStreaming: true,
    supportsStructuredOutput: true,
    supportsVision: true,
    supportsFunctionCalling: true,
  },
  {
    id: 'internlm',
    name: 'InternLM',
    type: 'compatible',
    supportsStreaming: true,
    supportsStructuredOutput: true,
    supportsVision: true,
    supportsFunctionCalling: true,
  },
  {
    id: 'giteeai',
    name: 'Gitee AI',
    type: 'compatible',
    supportsStreaming: true,
    supportsStructuredOutput: true,
  },
  {
    id: 'modelscope',
    name: 'ModelScope',
    type: 'compatible',
    supportsStreaming: true,
    supportsStructuredOutput: true,
    supportsVision: true,
  },
  {
    id: 'qiniu',
    name: 'Qiniu',
    type: 'compatible',
    supportsStreaming: true,
    supportsStructuredOutput: true,
  },
  {
    id: 'ppio',
    name: 'PPIO',
    type: 'compatible',
    supportsStreaming: true,
    supportsStructuredOutput: true,
  },
  {
    id: 'taichu',
    name: 'Taichu',
    type: 'compatible',
    supportsStreaming: true,
    supportsStructuredOutput: true,
    supportsVision: true,
  },
  {
    id: 'tencentcloud',
    name: 'Tencent Cloud',
    type: 'compatible',
    supportsStreaming: true,
    supportsStructuredOutput: true,
    supportsFunctionCalling: true,
  },
  {
    id: 'xiaomimimo',
    name: 'Xiaomi MiMo',
    type: 'compatible',
    supportsStreaming: true,
    supportsStructuredOutput: true,
    supportsFunctionCalling: true,
  },

  // Local/Self-hosted
  {
    id: 'lmstudio',
    name: 'LM Studio',
    type: 'compatible',
    supportsStreaming: true,
    supportsStructuredOutput: true,
    supportsVision: true,
  },
  {
    id: 'vllm',
    name: 'vLLM',
    type: 'compatible',
    supportsStreaming: true,
    supportsStructuredOutput: true,
  },
  {
    id: 'xinference',
    name: 'Xinference',
    type: 'compatible',
    supportsStreaming: true,
    supportsStructuredOutput: true,
    supportsVision: true,
  },
  {
    id: 'higress',
    name: 'Higress',
    type: 'compatible',
    supportsStreaming: true,
    supportsStructuredOutput: true,
  },
];

/**
 * All provider metadata combined
 */
export const ALL_PROVIDER_METADATA: ProviderMetadata[] = [
  ...OFFICIAL_PROVIDER_METADATA,
  ...COMPATIBLE_PROVIDER_METADATA,
];

/**
 * Get provider metadata by ID
 */
export function getProviderMetadata(id: string): ProviderMetadata | undefined {
  return ALL_PROVIDER_METADATA.find((p) => p.id === id);
}

/**
 * Get all providers of a specific type
 */
export function getProvidersByType(type: ProviderMetadata['type']): ProviderMetadata[] {
  return ALL_PROVIDER_METADATA.filter((p) => p.type === type);
}

/**
 * Get all provider IDs
 */
export function getAllProviderIds(): string[] {
  return ALL_PROVIDER_METADATA.map((p) => p.id);
}
