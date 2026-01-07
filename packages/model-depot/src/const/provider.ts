export enum ModelProvider {
  // Official SDK Providers (11)
  OpenAI = 'openai',
  Anthropic = 'anthropic',
  Azure = 'azure',
  Vertex = 'vertex',
  Google = 'google',
  XAI = 'xai',
  DeepSeek = 'deepseek',
  Mistral = 'mistral',
  OpenRouter = 'openrouter',
  Bedrock = 'bedrock',
  Ollama = 'ollama',

  // International Compatible Providers
  Groq = 'groq',
  Perplexity = 'perplexity',
  Cohere = 'cohere',
  TogetherAI = 'togetherai',
  FireworksAI = 'fireworksai',
  SambaNova = 'sambanova',
  GitHub = 'github',
  HuggingFace = 'huggingface',
  NVIDIA = 'nvidia',
  Cerebras = 'cerebras',
  Cloudflare = 'cloudflare',
  Nebius = 'nebius',
  Upstage = 'upstage',
  NovitaAI = 'novita',
  AI21 = 'ai21',
  BFL = 'bfl',
  InfiniAI = 'infiniai',
  Jina = 'jina',
  Search1API = 'search1api',
  Replicate = 'replicate',
  Fal = 'fal',
  XiaomiMiMo = 'xiaomimimo',

  // Chinese/Domestic Providers
  SiliconFlow = 'silicon',
  Dashscope = 'dashscope',
  Zhipu = 'zhipu',
  Baichuan = 'baichuan',
  Moonshot = 'moonshot',
  Yi = 'yi',
  MiniMax = 'minimax',
  StepFun = 'step',
  Hunyuan = 'hunyuan',
  Spark = 'spark',
  Qwen = 'qwen',
  Volcengine = 'volcengine',
  Wenxin = 'wenxin',
  SenseNova = 'sensenova',
  InternLM = 'internlm',
  GiteeAI = 'giteeai',
  ModelScope = 'modelscope',
  Qiniu = 'qiniu',
  PPIO = 'ppio',
  Taichu = 'taichu',
  TencentCloud = 'tencentcloud',

  // Local/Self-hosted
  LMStudio = 'lmstudio',
  VLLM = 'vllm',
  Xinference = 'xinference',
  Higress = 'higress',
}

export const ProviderDisplayNames: Record<ModelProvider, string> = {
  // Official SDK Providers
  [ModelProvider.OpenAI]: 'OpenAI',
  [ModelProvider.Anthropic]: 'Anthropic',
  [ModelProvider.Azure]: 'Azure OpenAI',
  [ModelProvider.Vertex]: 'Vertex AI',
  [ModelProvider.Google]: 'Google',
  [ModelProvider.XAI]: 'xAI',
  [ModelProvider.DeepSeek]: 'DeepSeek',
  [ModelProvider.Mistral]: 'Mistral AI',
  [ModelProvider.OpenRouter]: 'OpenRouter',
  [ModelProvider.Bedrock]: 'Amazon Bedrock',
  [ModelProvider.Ollama]: 'Ollama',

  // International Compatible Providers
  [ModelProvider.Groq]: 'Groq',
  [ModelProvider.Perplexity]: 'Perplexity',
  [ModelProvider.Cohere]: 'Cohere',
  [ModelProvider.TogetherAI]: 'Together AI',
  [ModelProvider.FireworksAI]: 'Fireworks AI',
  [ModelProvider.SambaNova]: 'SambaNova',
  [ModelProvider.GitHub]: 'GitHub Models',
  [ModelProvider.HuggingFace]: 'Hugging Face',
  [ModelProvider.NVIDIA]: 'NVIDIA',
  [ModelProvider.Cerebras]: 'Cerebras',
  [ModelProvider.Cloudflare]: 'Cloudflare Workers AI',
  [ModelProvider.Nebius]: 'Nebius AI Studio',
  [ModelProvider.Upstage]: 'Upstage',
  [ModelProvider.NovitaAI]: 'Novita AI',
  [ModelProvider.AI21]: 'AI21 Labs',
  [ModelProvider.BFL]: 'Black Forest Labs',
  [ModelProvider.InfiniAI]: 'InfiniAI',
  [ModelProvider.Jina]: 'Jina AI',
  [ModelProvider.Search1API]: 'Search1API',
  [ModelProvider.Replicate]: 'Replicate',
  [ModelProvider.Fal]: 'fal',
  [ModelProvider.XiaomiMiMo]: 'Xiaomi MiMo',

  // Chinese/Domestic Providers
  [ModelProvider.SiliconFlow]: 'SiliconFlow',
  [ModelProvider.Dashscope]: 'Aliyun Bailian',
  [ModelProvider.Zhipu]: 'Zhipu AI',
  [ModelProvider.Baichuan]: 'Baichuan AI',
  [ModelProvider.Moonshot]: 'Moonshot AI',
  [ModelProvider.Yi]: '01.AI (Yi)',
  [ModelProvider.MiniMax]: 'MiniMax',
  [ModelProvider.StepFun]: 'StepFun',
  [ModelProvider.Hunyuan]: 'Tencent Hunyuan',
  [ModelProvider.Spark]: 'iFlytek Spark',
  [ModelProvider.Qwen]: 'Alibaba Qwen',
  [ModelProvider.Volcengine]: 'Volcengine Doubao',
  [ModelProvider.Wenxin]: 'Baidu Wenxin',
  [ModelProvider.SenseNova]: 'SenseNova',
  [ModelProvider.InternLM]: 'InternLM',
  [ModelProvider.GiteeAI]: 'Gitee AI',
  [ModelProvider.ModelScope]: 'ModelScope',
  [ModelProvider.Qiniu]: 'Qiniu',
  [ModelProvider.PPIO]: 'PPIO',
  [ModelProvider.Taichu]: 'Taichu',
  [ModelProvider.TencentCloud]: 'Tencent Cloud',

  // Local/Self-hosted
  [ModelProvider.LMStudio]: 'LM Studio',
  [ModelProvider.VLLM]: 'vLLM',
  [ModelProvider.Xinference]: 'Xinference',
  [ModelProvider.Higress]: 'Higress',
};

export function isValidProvider(providerId: string): providerId is ModelProvider {
  return Object.values(ModelProvider).includes(providerId as ModelProvider);
}

/**
 * Maps UI provider type names to model-depot provider IDs.
 * Used when creating custom providers to determine which model catalog to use.
 */
export const PROVIDER_TYPE_TO_DEPOT_ID: Record<string, string> = {
  OpenAI: 'openai',
  'OpenAI-Response': 'openai',
  Gemini: 'google',
  Anthropic: 'anthropic',
  'Azure OpenAI': 'azure',
  'New API': 'openai',
  CherryIn: 'openai',
};

export const PROVIDER_OPTIONS = Object.keys(PROVIDER_TYPE_TO_DEPOT_ID);

/**
 * Priority:
 * 1. Custom provider (isCustom=true) → use providerType (e.g., "openai", "anthropic")
 * 2. Built-in provider → use id (e.g., "openai", "anthropic")
 * 3. Fallback → return 'openai'
 */
export function resolveProviderType(provider: {
  id: string;
  providerType?: string | null;
  isCustom?: boolean;
}): string {
  if (provider.isCustom && provider.providerType) {
    return provider.providerType;
  }

  const lowerId = provider.id.toLowerCase();
  if (isValidProvider(lowerId)) {
    return lowerId;
  }

  return 'openai';
}
