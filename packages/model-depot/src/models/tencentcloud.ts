import type { ChatModelCard } from '../types';

const tencentcloudModels: ChatModelCard[] = [
  {
    id: 'deepseek-v3',
    displayName: 'DeepSeek V3',
    description: 'DeepSeek V3 是一款性能卓越的通用大语言模型，在腾讯云知识引擎平台提供服务。',
    type: 'chat',
    contextWindowTokens: 65_536,
    maxOutput: 16_000,
    enabled: true,
    pricing: { currency: 'CNY', input: 2, output: 8 },
  },
  {
    id: 'deepseek-r1',
    displayName: 'DeepSeek R1',
    description: 'DeepSeek R1 是一款深度推理模型，擅长复杂问题分析和逻辑推理。',
    type: 'chat',
    contextWindowTokens: 65_536,
    maxOutput: 16_000,
    enabled: true,
    abilities: { reasoning: true },
    pricing: { currency: 'CNY', input: 4, output: 16 },
  },
  {
    id: 'deepseek-r1-distill-qwen-32b',
    displayName: 'DeepSeek R1 Distill Qwen 32B',
    description: 'DeepSeek R1 Distill Qwen 32B 是蒸馏优化后的推理模型。',
    type: 'chat',
    contextWindowTokens: 32_768,
    abilities: { reasoning: true },
  },
  {
    id: 'qwen2.5-72b-instruct',
    displayName: 'Qwen2.5 72B Instruct',
    description: 'Qwen2.5 72B Instruct 是阿里通义千问的旗舰指令模型。',
    type: 'chat',
    contextWindowTokens: 131_072,
  },
  {
    id: 'qwen2.5-32b-instruct',
    displayName: 'Qwen2.5 32B Instruct',
    description: 'Qwen2.5 32B Instruct 提供平衡的性能与成本。',
    type: 'chat',
    contextWindowTokens: 32_768,
  },
  {
    id: 'llama-3.1-70b-instruct',
    displayName: 'Llama 3.1 70B Instruct',
    description: 'Llama 3.1 70B Instruct 是 Meta 的高性能开源语言模型。',
    type: 'chat',
    contextWindowTokens: 128_000,
  },
  {
    id: 'hunyuan-turbo',
    displayName: 'Hunyuan Turbo',
    description: '混元大模型是腾讯自研的通用大语言模型，具备强大的中文理解能力。',
    type: 'chat',
    contextWindowTokens: 128_000,
    abilities: { functionCall: true },
  },
  {
    id: 'deepseek-v3-0324',
    displayName: 'DeepSeek V3 0324',
    description:
      'DeepSeek-V3-0324 is a 671B-parameter MoE model with standout strengths in programming and technical capability, context understanding, and long-text handling.',
    type: 'chat',
    contextWindowTokens: 65_536,
    maxOutput: 16_000,
    enabled: true,
    pricing: { currency: 'CNY', input: 2, output: 8 },
  },
];

export default tencentcloudModels;
