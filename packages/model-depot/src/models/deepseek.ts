import type { ChatModelCard } from '../types';

const deepseekModels: ChatModelCard[] = [
  {
    id: 'deepseek-chat-v3.2-speciale',
    displayName: 'DeepSeek V3.2 Speciale',
    description:
      'DeepSeek V3.2 Speciale 是高算力变体，具备超越 GPT-5 级别的推理能力，在 IMO/IOI 竞赛中达到金牌水平。',
    type: 'chat',
    contextWindowTokens: 131_072,
    maxOutput: 16_384,
    enabled: true,
    abilities: { functionCall: true, reasoning: true, structuredOutput: true },
    pricing: { input: 0.55, output: 2.19, cachedInput: 0.14 },
  },
  {
    id: 'deepseek-chat',
    displayName: 'DeepSeek V3.2',
    description: 'DeepSeek V3.2 是 DeepSeek 最新的通用对话模型，具备更强的推理和编码能力。',
    type: 'chat',
    contextWindowTokens: 1_000_000,
    maxOutput: 384_000,
    enabled: true,
    legacy: true,
    abilities: { functionCall: true, structuredOutput: true },
    pricing: { currency: 'CNY', input: 1, output: 2, cachedInput: 0.02 },
    releasedAt: '2025-12-01',
  },
  {
    id: 'deepseek-coder',
    displayName: 'DeepSeek Coder',
    description: 'DeepSeek Coder 专门针对编程任务优化。',
    type: 'chat',
    contextWindowTokens: 65_536,
    maxOutput: 8_192,
    abilities: { functionCall: true, structuredOutput: true },
    pricing: { input: 0.14, output: 0.28, cachedInput: 0.014 },
  },
  {
    id: 'deepseek-reasoner',
    displayName: 'DeepSeek V3.2 Thinking',
    description: 'DeepSeek V3.2 Thinking 是具有强大推理能力的深度思考模型。',
    type: 'chat',
    contextWindowTokens: 1_000_000,
    maxOutput: 384_000,
    legacy: true,
    abilities: { reasoning: true, functionCall: true },
    pricing: { currency: 'CNY', input: 1, output: 2, cachedInput: 0.02 },
    releasedAt: '2025-12-01',
  },
  {
    id: 'deepseek-v4-flash',
    displayName: 'DeepSeek V4 Flash',
    description:
      'DeepSeek V4 Flash is the cost-efficient member of the V4 family with a 1M context window and hybrid thinking.',
    type: 'chat',
    contextWindowTokens: 1_000_000,
    maxOutput: 384_000,
    enabled: true,
    abilities: { functionCall: true, reasoning: true, structuredOutput: true },
    pricing: { currency: 'CNY', input: 1, output: 2, cachedInput: 0.02 },
    releasedAt: '2026-04-24',
  },
  {
    id: 'deepseek-v4-pro',
    displayName: 'DeepSeek V4 Pro',
    description:
      'DeepSeek V4 Pro is the flagship of the V4 family, optimized for high-intensity reasoning, agentic workflows, and long-horizon planning.',
    type: 'chat',
    contextWindowTokens: 1_000_000,
    maxOutput: 384_000,
    enabled: true,
    abilities: { functionCall: true, reasoning: true, structuredOutput: true },
    pricing: { currency: 'CNY', input: 3, output: 6, cachedInput: 0.025 },
    releasedAt: '2026-04-24',
  },
];

export default deepseekModels;
