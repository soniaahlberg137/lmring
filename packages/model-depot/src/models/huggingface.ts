import type { ChatModelCard } from '../types';

const huggingfaceModels: ChatModelCard[] = [
  {
    id: 'mistralai/Mistral-7B-Instruct-v0.3',
    displayName: 'Mistral 7B Instruct v0.3',
    description: 'Mistral AI指令调优模型，轻量高效。',
    type: 'chat',
    contextWindowTokens: 32_768,
  },
  {
    id: 'google/gemma-2-2b-it',
    displayName: 'Gemma 2 2B Instruct',
    description: 'Google轻量级指令调优模型。',
    type: 'chat',
    contextWindowTokens: 8_192,
  },
  {
    id: 'Qwen/Qwen2.5-72B-Instruct',
    displayName: 'Qwen 2.5 72B Instruct',
    description: '阿里云通义千问团队开发的大语言模型。',
    type: 'chat',
    contextWindowTokens: 32_768,
  },
  {
    id: 'Qwen/Qwen2.5-Coder-32B-Instruct',
    displayName: 'Qwen 2.5 Coder 32B Instruct',
    description: 'Qwen2.5代码编写专用模型。',
    type: 'chat',
    contextWindowTokens: 32_768,
  },
  {
    id: 'Qwen/QwQ-32B-Preview',
    displayName: 'QwQ 32B Preview',
    description: 'Qwen实验研究模型，专注AI推理能力。',
    type: 'chat',
    contextWindowTokens: 32_768,
    abilities: { reasoning: true },
  },
  {
    id: 'microsoft/Phi-3.5-mini-instruct',
    displayName: 'Phi 3.5 mini instruct',
    description: 'Microsoft Phi-3.5迷你指令模型。',
    type: 'chat',
    contextWindowTokens: 32_768,
  },
  {
    id: 'NousResearch/Hermes-3-Llama-3.1-8B',
    displayName: 'Hermes 3 Llama 3.1 8B',
    description: 'NousResearch基于Llama 3.1的Hermes模型。',
    type: 'chat',
    contextWindowTokens: 16_384,
  },
  {
    id: 'deepseek-ai/DeepSeek-R1',
    displayName: 'DeepSeek R1',
    description: 'DeepSeek推理模型，HuggingFace托管。',
    type: 'chat',
    contextWindowTokens: 128_000,
    abilities: { reasoning: true },
  },
  {
    id: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-32B',
    displayName: 'DeepSeek R1 (Distill Qwen 32B)',
    description: 'DeepSeek R1蒸馏版Qwen 32B。',
    type: 'chat',
    contextWindowTokens: 16_384,
    abilities: { reasoning: true },
  },
];

export default huggingfaceModels;
