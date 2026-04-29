import type { ChatModelCard } from '../types';

const cloudflareModels: ChatModelCard[] = [
  {
    id: '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b',
    displayName: 'DeepSeek R1 (Distill Qwen 32B)',
    description: 'Cloudflare托管DeepSeek R1蒸馏版。',
    type: 'chat',
    contextWindowTokens: 80_000,
    enabled: true,
    abilities: { reasoning: true },
  },
  {
    id: '@cf/qwen/qwq-32b',
    displayName: 'QwQ 32B',
    description: 'Cloudflare托管Qwen QwQ推理模型。',
    type: 'chat',
    contextWindowTokens: 24_000,
    enabled: true,
    abilities: { reasoning: true },
  },
  {
    id: '@cf/qwen/qwen2.5-coder-32b-instruct',
    displayName: 'Qwen2.5 Coder 32B',
    description: 'Cloudflare托管Qwen代码模型。',
    type: 'chat',
    contextWindowTokens: 32_768,
  },
  {
    id: '@cf/google/gemma-3-12b-it',
    displayName: 'Gemma 3 12B',
    description: 'Cloudflare托管Google Gemma 3模型。',
    type: 'chat',
    contextWindowTokens: 80_000,
  },
  {
    id: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
    displayName: 'Llama 3.3 70B',
    description: 'Cloudflare托管Llama 3.3高速版。',
    type: 'chat',
    contextWindowTokens: 24_000,
    abilities: { functionCall: true },
  },
  {
    id: '@cf/meta/llama-4-scout-17b-16e-instruct',
    displayName: 'Llama 4 17B',
    description: 'Cloudflare托管Meta Llama 4 Scout。',
    type: 'chat',
    contextWindowTokens: 131_000,
    abilities: { functionCall: true },
  },
  {
    id: '@cf/mistralai/mistral-small-3.1-24b-instruct',
    displayName: 'Mistral Small 3.1 24B',
    description: 'Cloudflare托管Mistral Small模型。',
    type: 'chat',
    contextWindowTokens: 128_000,
    abilities: { functionCall: true },
  },
  {
    id: '@cf/meta/llama-3.1-8b-instruct-fast',
    displayName: 'Llama 3.1 8B',
    description: 'Cloudflare托管Llama 3.1快速版。',
    type: 'chat',
    contextWindowTokens: 128_000,
  },
  {
    id: '@cf/openchat/openchat-3.5-0106',
    displayName: 'openchat-3.5-0106',
    type: 'chat',
    contextWindowTokens: 8_192,
  },
  {
    id: '@cf/qwen/qwen1.5-14b-chat-awq',
    displayName: 'qwen1.5-14b-chat-awq',
    type: 'chat',
    contextWindowTokens: 7_500,
    enabled: true,
  },
];

export default cloudflareModels;
