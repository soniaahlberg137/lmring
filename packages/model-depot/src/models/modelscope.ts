import type { ChatModelCard } from '../types';

const modelscopeModels: ChatModelCard[] = [
  {
    id: 'Qwen/Qwen3-4B',
    displayName: 'Qwen3 4B',
    description: 'Qwen3-4B 是通义千问团队开发的轻量级高效语言模型。',
    type: 'chat',
    contextWindowTokens: 32_768,
    enabled: true,
  },
  {
    id: 'Qwen/Qwen2.5-72B-Instruct',
    displayName: 'Qwen2.5 72B Instruct',
    description: 'Qwen2.5-72B-Instruct 是一款超大规模的指令遵循模型，具有出色的语言理解能力。',
    type: 'chat',
    contextWindowTokens: 32_768,
  },
  {
    id: 'Qwen/Qwen2.5-32B-Instruct',
    displayName: 'Qwen2.5 32B Instruct',
    description: 'Qwen2.5-32B-Instruct 提供平衡的性能和效率。',
    type: 'chat',
    contextWindowTokens: 32_768,
  },
  {
    id: 'Qwen/Qwen2.5-7B-Instruct',
    displayName: 'Qwen2.5 7B Instruct',
    description: 'Qwen2.5-7B-Instruct 是一款高效的中等规模语言模型。',
    type: 'chat',
    contextWindowTokens: 131_072,
  },
  {
    id: 'deepseek-ai/DeepSeek-R1',
    displayName: 'DeepSeek R1',
    description: 'DeepSeek R1 具备强大的推理和思考能力。',
    type: 'chat',
    contextWindowTokens: 131_072,
    enabled: true,
    abilities: { reasoning: true },
  },
  {
    id: 'deepseek-ai/DeepSeek-V3',
    displayName: 'DeepSeek V3',
    description: 'DeepSeek V3 是一款高性能的通用大语言模型。',
    type: 'chat',
    contextWindowTokens: 65_536,
  },
  {
    id: 'LLM-Research/Llama-3.3-70B-Instruct',
    displayName: 'Llama 3.3 70B Instruct',
    description: 'Llama 3.3 70B Instruct 是 Meta 最新发布的大规模开源模型。',
    type: 'chat',
    contextWindowTokens: 128_000,
  },
  {
    id: 'LLM-Research/Meta-Llama-3.1-8B-Instruct',
    displayName: 'Llama 3.1 8B Instruct',
    description: 'Llama 3.1 8B Instruct 是一款轻量高效的指令模型。',
    type: 'chat',
    contextWindowTokens: 128_000,
  },
  {
    id: 'OpenGVLab/InternVL2-8B',
    displayName: 'InternVL2 8B',
    description: 'InternVL2-8B 是书生团队开发的多模态视觉语言模型。',
    type: 'chat',
    contextWindowTokens: 8_192,
    abilities: { vision: true },
  },
  {
    id: 'Qwen/Qwen3-Next-80B-A3B-Thinking',
    displayName: 'Qwen3 Next 80B A3B Thinking',
    type: 'chat',
    contextWindowTokens: 131_072,
    abilities: { functionCall: true, reasoning: true },
  },
  {
    id: 'Qwen/Qwen3-Next-80B-A3B-Instruct',
    displayName: 'Qwen3 Next 80B A3B Instruct',
    type: 'chat',
    contextWindowTokens: 131_072,
    abilities: { functionCall: true },
  },
  {
    id: 'deepseek-ai/DeepSeek-V3.2',
    displayName: 'DeepSeek V3.2',
    type: 'chat',
    contextWindowTokens: 131_072,
    enabled: true,
    abilities: { functionCall: true, reasoning: true },
  },
  {
    id: 'deepseek-ai/DeepSeek-V3.2-Exp',
    displayName: 'DeepSeek V3.2 Exp',
    description:
      'DeepSeek V3.2 Exp uses a hybrid reasoning architecture and supports both thinking and non-thinking modes.',
    type: 'chat',
    contextWindowTokens: 131_072,
    abilities: { functionCall: true, reasoning: true },
  },
  {
    id: 'deepseek-ai/DeepSeek-V3.1',
    displayName: 'DeepSeek V3.1',
    description:
      'DeepSeek V3.1 uses a hybrid reasoning architecture and supports both thinking and non-thinking modes.',
    type: 'chat',
    contextWindowTokens: 131_072,
    abilities: { functionCall: true, reasoning: true },
  },
  {
    id: 'deepseek-ai/DeepSeek-R1-0528',
    displayName: 'DeepSeek R1 0528',
    description:
      'DeepSeek R1 leverages additional compute and post-training algorithmic optimizations to deepen reasoning.',
    type: 'chat',
    contextWindowTokens: 131_072,
    abilities: { functionCall: true, reasoning: true },
  },
  {
    id: 'Qwen/Qwen3-235B-A22B',
    displayName: 'Qwen3 235B A22B',
    description:
      'Qwen3 235B A22B is the Qwen3 ultra-scale model delivering top-tier AI capability.',
    type: 'chat',
    contextWindowTokens: 131_072,
    abilities: { functionCall: true },
  },
  {
    id: 'Qwen/Qwen3-32B',
    displayName: 'Qwen3 32B',
    description: 'Qwen3 32B is a Qwen3 model with strong reasoning and chat capabilities.',
    type: 'chat',
    contextWindowTokens: 131_072,
    abilities: { functionCall: true },
  },
];

export default modelscopeModels;
