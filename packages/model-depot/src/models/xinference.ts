import type { ChatModelCard } from '../types';

const xinferenceModels: ChatModelCard[] = [
  {
    id: 'deepseek-v3',
    displayName: 'DeepSeek V3',
    description:
      'DeepSeek-V3 is a powerful MoE model with 671B total parameters and 37B active per token.',
    type: 'chat',
    contextWindowTokens: 163_840,
    enabled: true,
    abilities: { functionCall: true },
  },
  {
    id: 'deepseek-r1',
    displayName: 'DeepSeek R1',
    description:
      'DeepSeek-R1 uses cold-start data before RL and performs comparably to OpenAI-o1 on math, coding, and reasoning.',
    type: 'chat',
    contextWindowTokens: 163_840,
    enabled: true,
    abilities: { reasoning: true },
  },
  {
    id: 'deepseek-r1-distill-llama',
    displayName: 'DeepSeek R1 Distill Llama',
    description: 'deepseek-r1-distill-llama is distilled from DeepSeek-R1 on Llama.',
    type: 'chat',
    contextWindowTokens: 131_072,
    enabled: true,
    abilities: { reasoning: true },
  },
  {
    id: 'deepseek-r1-distill-qwen',
    displayName: 'DeepSeek R1 Distill Qwen',
    description: 'deepseek-r1-distill-qwen is distilled from DeepSeek-R1 on Qwen.',
    type: 'chat',
    contextWindowTokens: 131_072,
    enabled: true,
    abilities: { reasoning: true },
  },
  {
    id: 'qwq-32b',
    displayName: 'QwQ 32B',
    description: 'QwQ is a reasoning model in the Qwen family.',
    type: 'chat',
    contextWindowTokens: 32_768,
    enabled: true,
    abilities: { reasoning: true },
  },
  {
    id: 'qvq-72b-preview',
    displayName: 'QVQ 72B Preview',
    description:
      'QVQ-72B-Preview is an experimental research model from Qwen focused on improving visual reasoning.',
    type: 'chat',
    contextWindowTokens: 32_768,
    enabled: true,
    abilities: { reasoning: true, vision: true },
  },
  {
    id: 'qwen2.5-instruct',
    displayName: 'Qwen2.5 Instruct',
    description:
      'Qwen2.5 is the latest Qwen LLM series, with base and instruction-tuned models ranging from 0.5B to 72B parameters.',
    type: 'chat',
    contextWindowTokens: 32_768,
    enabled: true,
    abilities: { functionCall: true },
  },
  {
    id: 'qwen2.5-coder-instruct',
    displayName: 'Qwen2.5 Coder Instruct',
    description:
      'Qwen2.5-Coder is the latest code-focused LLM in the Qwen family (formerly CodeQwen).',
    type: 'chat',
    contextWindowTokens: 32_768,
    enabled: true,
    abilities: { functionCall: true },
  },
  {
    id: 'qwen2.5-vl-instruct',
    displayName: 'Qwen2.5 VL Instruct',
    description: 'Qwen2.5-VL is the latest vision-language model in the Qwen family.',
    type: 'chat',
    contextWindowTokens: 128_000,
    enabled: true,
    abilities: { vision: true },
  },
  {
    id: 'mistral-nemo-instruct',
    displayName: 'Mistral Nemo Instruct',
    description:
      'Mistral-Nemo-Instruct-2407 is the instruction-tuned version of Mistral-Nemo-Base-2407.',
    type: 'chat',
    contextWindowTokens: 1_024_000,
    enabled: true,
  },
  {
    id: 'mistral-large-instruct',
    displayName: 'Mistral Large Instruct',
    description:
      'Mistral-Large-Instruct-2407 is an advanced dense LLM with 123B parameters and state-of-the-art reasoning, knowledge, and coding.',
    type: 'chat',
    contextWindowTokens: 131_072,
    enabled: true,
  },
  {
    id: 'llama-3.3-instruct',
    displayName: 'Llama 3.3 Instruct',
    description:
      'Llama 3.3 instruction-tuned model is optimized for chat and beats many open chat models on common industry benchmarks.',
    type: 'chat',
    contextWindowTokens: 131_072,
    enabled: true,
    abilities: { functionCall: true },
  },
  {
    id: 'llama-3.2-vision-instruct',
    displayName: 'Llama 3.2 Vision Instruct',
    description:
      'Llama 3.2-Vision instruction-tuned model is optimized for visual recognition, image reasoning, captioning, and general image Q&A.',
    type: 'chat',
    contextWindowTokens: 163_840,
    enabled: true,
    abilities: { vision: true },
  },
  {
    id: 'llama-3.1-instruct',
    displayName: 'Llama 3.1 Instruct',
    description:
      'Llama 3.1 instruction-tuned model is optimized for chat and beats many open chat models on common industry benchmarks.',
    type: 'chat',
    contextWindowTokens: 131_072,
    enabled: true,
    abilities: { functionCall: true },
  },
];

export default xinferenceModels;
