import type { ChatModelCard } from '../types';

const deepseekModels: ChatModelCard[] = [
  {
    id: 'deepseek-chat',
    displayName: 'DeepSeek V3.2',
    description: 'DeepSeek V3.2 是 DeepSeek 最新的通用对话模型，具备更强的推理和编码能力。',
    type: 'chat',
    contextWindowTokens: 131_072,
    maxOutput: 16_384,
    enabled: true,
    abilities: {
      functionCall: true,
      structuredOutput: true,
    },
    pricing: {
      input: 0.14,
      output: 0.28,
      cachedInput: 0.014,
    },
  },
  {
    id: 'deepseek-coder',
    displayName: 'DeepSeek Coder',
    description: 'DeepSeek Coder 专门针对编程任务优化。',
    type: 'chat',
    contextWindowTokens: 65_536,
    maxOutput: 8_192,
    abilities: {
      functionCall: true,
      structuredOutput: true,
    },
    pricing: {
      input: 0.14,
      output: 0.28,
      cachedInput: 0.014,
    },
  },
  {
    id: 'deepseek-reasoner',
    displayName: 'DeepSeek V3.2 Thinking',
    description: 'DeepSeek V3.2 Thinking 是具有强大推理能力的深度思考模型。',
    type: 'chat',
    contextWindowTokens: 131_072,
    maxOutput: 16_384,
    abilities: {
      reasoning: true,
      functionCall: true,
    },
    pricing: {
      input: 0.55,
      output: 2.19,
      cachedInput: 0.14,
    },
  },
];

export default deepseekModels;
