export interface EndpointConfig {
  baseURL: string;
  alternativeBaseURL?: string;
  defaultHeaders?: Record<string, string>;
}

export const PROVIDER_ENDPOINTS: Record<string, EndpointConfig> = {
  // Official Providers (for UI display purposes)
  openai: {
    baseURL: 'https://api.openai.com/v1',
  },
  anthropic: {
    baseURL: 'https://api.anthropic.com',
  },
  google: {
    baseURL: 'https://generativelanguage.googleapis.com',
  },
  mistral: {
    baseURL: 'https://api.mistral.ai',
  },
  xai: {
    baseURL: 'https://api.x.ai/v1',
  },
  deepseek: {
    baseURL: 'https://api.deepseek.com',
  },

  // International Compatible Providers
  openrouter: {
    baseURL: 'https://openrouter.ai/api/v1',
  },
  groq: {
    baseURL: 'https://api.groq.com/openai/v1',
  },
  perplexity: {
    baseURL: 'https://api.perplexity.ai',
  },
  cohere: {
    baseURL: 'https://api.cohere.com/v2',
  },
  togetherai: {
    baseURL: 'https://api.together.xyz/v1',
  },
  fireworksai: {
    baseURL: 'https://api.fireworks.ai/inference/v1',
  },
  sambanova: {
    baseURL: 'https://api.sambanova.ai/v1',
  },
  github: {
    baseURL: 'https://models.inference.ai.azure.com',
  },
  huggingface: {
    baseURL: 'https://api-inference.huggingface.co/v1',
  },
  nvidia: {
    baseURL: 'https://integrate.api.nvidia.com/v1',
  },
  cerebras: {
    baseURL: 'https://api.cerebras.ai/v1',
  },
  cloudflare: {
    baseURL: 'https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/v1',
  },
  nebius: {
    baseURL: 'https://api.studio.nebius.com/v1',
  },
  upstage: {
    baseURL: 'https://api.upstage.ai/v1/solar',
  },
  novita: {
    baseURL: 'https://api.novita.ai/v3/openai',
  },
  ai21: {
    baseURL: 'https://api.ai21.com/studio/v1',
  },
  bfl: {
    baseURL: 'https://api.bfl.ml',
  },
  infiniai: {
    baseURL: 'https://cloud.infini-ai.com/maas/v1',
  },
  jina: {
    baseURL: 'https://deepsearch.jina.ai/v1',
  },
  search1api: {
    baseURL: 'https://api.search1api.com/v1',
  },
  fal: {
    baseURL: 'https://fal.run',
  },

  // Chinese/Domestic Providers
  silicon: {
    baseURL: 'https://api.siliconflow.cn/v1',
  },
  dashscope: {
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  },
  zhipu: {
    baseURL: 'https://open.bigmodel.cn/api/paas/v4',
    alternativeBaseURL: 'https://open.bigmodel.cn/api/anthropic',
  },
  baichuan: {
    baseURL: 'https://api.baichuan-ai.com/v1',
  },
  moonshot: {
    baseURL: 'https://api.moonshot.cn/v1',
  },
  yi: {
    baseURL: 'https://api.lingyiwanwu.com/v1',
  },
  minimax: {
    baseURL: 'https://api.minimax.chat/v1',
    alternativeBaseURL: 'https://api.minimax.chat/v1/anthropic',
  },
  step: {
    baseURL: 'https://api.stepfun.com/v1',
  },
  hunyuan: {
    baseURL: 'https://api.hunyuan.cloud.tencent.com/v1',
  },
  spark: {
    baseURL: 'https://spark-api-open.xf-yun.com/v1',
  },
  volcengine: {
    baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
  },
  wenxin: {
    baseURL: 'https://qianfan.baidubce.com/v2',
  },
  sensenova: {
    baseURL: 'https://api.sensenova.cn/v1/llm',
  },
  internlm: {
    baseURL: 'https://internlm-chat.intern-ai.org.cn/puyu/api/v1',
  },
  giteeai: {
    baseURL: 'https://ai.gitee.com/v1',
  },
  modelscope: {
    baseURL: 'https://api-inference.modelscope.cn/v1',
  },
  qiniu: {
    baseURL: 'https://openai.qiniu.com/v1',
  },
  ppio: {
    baseURL: 'https://api.ppinfra.com/v3/openai',
  },
  taichu: {
    baseURL: 'https://ai-maas.wair.ac.cn/maas/v1',
  },
  tencentcloud: {
    baseURL: 'https://api.lkeap.cloud.tencent.com/v1',
  },
  xiaomimimo: {
    baseURL: 'https://api.xiaomimimo.com/v1',
  },

  // Local/Self-hosted
  lmstudio: {
    baseURL: 'http://127.0.0.1:1234/v1',
  },
  vllm: {
    baseURL: 'http://localhost:8000/v1',
  },
  xinference: {
    baseURL: 'http://localhost:9997/v1',
  },
  higress: {
    baseURL: 'https://127.0.0.1:8080/v1',
  },
};

export function getEndpointConfig(providerId: string): EndpointConfig | undefined {
  return PROVIDER_ENDPOINTS[providerId];
}
