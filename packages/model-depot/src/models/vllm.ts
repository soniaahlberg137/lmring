import type { ChatModelCard } from '../types';

const vllmModels: ChatModelCard[] = [
  {
    id: 'meta-llama/Meta-Llama-3.1-70B',
    displayName: 'Llama 3.1 70B',
    description:
      'Llama 3.1 is Meta’s leading model family, scaling up to 405B parameters for complex dialogue, multilingual translation, and data analysis.',
    type: 'chat',
    contextWindowTokens: 128_000,
    enabled: true,
    abilities: { functionCall: true },
  },
  {
    id: 'meta-llama/Meta-Llama-3.1-405B-Instruct',
    displayName: 'Llama 3.1 405B Instruct',
    description:
      'Llama 3.1 is Meta’s leading model family, scaling up to 405B parameters for complex dialogue, multilingual translation, and data analysis.',
    type: 'chat',
    contextWindowTokens: 128_000,
    abilities: { functionCall: true },
  },
  {
    id: 'google/gemma-2-9b',
    displayName: 'Gemma 2 9B',
    description:
      'Gemma 2 is Google’s efficient model family for use cases from small apps to complex data processing.',
    type: 'chat',
    contextWindowTokens: 8_192,
  },
  {
    id: 'google/gemma-2-27b',
    displayName: 'Gemma 2 27B',
    description:
      'Gemma 2 is Google’s efficient model family for use cases from small apps to complex data processing.',
    type: 'chat',
    contextWindowTokens: 8_192,
  },
  {
    id: 'mistralai/Mistral-7B-Instruct-v0.1',
    displayName: 'Mistral 7B Instruct v0.1',
    description:
      'Mistral (7B) Instruct is known for strong performance across many language tasks.',
    type: 'chat',
    contextWindowTokens: 8_192,
  },
  {
    id: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
    displayName: 'Mistral 8x7B Instruct v0.1',
    description:
      'Mixtral-8x7B Instruct (46.7B) provides high capacity for large-scale data processing.',
    type: 'chat',
    contextWindowTokens: 32_768,
  },
  {
    id: 'deepseek-ai/DeepSeek-V3',
    displayName: 'DeepSeek V3',
    description:
      'DeepSeek-V3 is a 671B-parameter MoE model using MLA and DeepSeekMoE with loss-free load balancing for efficient training and inference.',
    type: 'chat',
    contextWindowTokens: 65_536,
    enabled: true,
    abilities: { functionCall: true },
  },
  {
    id: 'Qwen/QwQ-32B-Preview',
    displayName: 'QwQ 32B Preview',
    description: 'Qwen QwQ is an experimental research model focused on improved AI reasoning.',
    type: 'chat',
    contextWindowTokens: 32_768,
    enabled: true,
    abilities: { reasoning: true },
  },
  {
    id: 'Qwen/Qwen2-7B-Instruct',
    displayName: 'Qwen2 7B Instruct',
    description:
      'Qwen2-7B-Instruct is a 7B instruction-tuned model in the Qwen2 series using Transformer, SwiGLU, QKV bias, and grouped-query attention.',
    type: 'chat',
    contextWindowTokens: 32_768,
    enabled: true,
  },
];

export default vllmModels;
