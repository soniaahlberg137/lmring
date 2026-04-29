import type { ChatModelCard, TTSModelCard } from '../types';

const xiaomimimoChatModels: ChatModelCard[] = [
  {
    id: 'mimo-v2.5-pro',
    displayName: 'MiMo-V2.5 Pro',
    description:
      'MiMo-V2.5-Pro 是小米迄今最强的旗舰模型，沿用 1T 总参/42B 激活的混合注意力架构与 1M 上下文窗口，具备出色的复杂软件工程与长程任务能力，可承载千次以上的工具调用。',
    type: 'chat',
    contextWindowTokens: 1_000_000,
    maxOutput: 131_072,
    enabled: true,
    abilities: {
      functionCall: true,
      reasoning: true,
      search: true,
      structuredOutput: true,
    },
    pricing: {
      currency: 'CNY',
      input: 7,
      output: 21,
      cachedInput: 1.4,
    },
    releasedAt: '2026-04-22',
  },
  {
    id: 'mimo-v2.5',
    displayName: 'MiMo-V2.5',
    description:
      'MiMo-V2.5 是原生全模态 Agent 基座模型，统一架构下理解图像、视频、音频与文本，支持 1M 上下文。在显著降低推理成本的同时，提供 Pro 级的智能体表现，适用于延迟敏感的多步 Agent 场景。',
    type: 'chat',
    contextWindowTokens: 1_000_000,
    maxOutput: 131_072,
    enabled: true,
    abilities: {
      functionCall: true,
      reasoning: true,
      search: true,
      structuredOutput: true,
      video: true,
      vision: true,
    },
    pricing: {
      currency: 'CNY',
      input: 2.8,
      output: 14,
      cachedInput: 0.56,
    },
    releasedAt: '2026-04-22',
  },
  {
    id: 'mimo-v2-pro',
    displayName: 'MiMo-V2 Pro',
    description:
      'MiMo-V2-Pro 是小米旗舰级推理模型，拥有百万级上下文窗口，适用于复杂推理、编码和结构化输出任务。',
    type: 'chat',
    contextWindowTokens: 1_000_000,
    maxOutput: 131_072,
    enabled: true,
    abilities: {
      functionCall: true,
      reasoning: true,
      structuredOutput: true,
    },
    pricing: {
      currency: 'CNY',
      input: 7,
      output: 21,
      cachedInput: 1.4,
    },
    releasedAt: '2026-03-19',
  },
  {
    id: 'mimo-v2-omni',
    displayName: 'MiMo-V2 Omni',
    description: 'MiMo-V2-Omni 是小米多模态模型，支持视觉和视频理解，适用于多模态交互场景。',
    type: 'chat',
    contextWindowTokens: 262_144,
    maxOutput: 131_072,
    enabled: true,
    abilities: {
      functionCall: true,
      vision: true,
      video: true,
    },
    pricing: {
      currency: 'CNY',
      input: 2.8,
      output: 14,
      cachedInput: 0.56,
    },
    releasedAt: '2026-03-19',
  },
  {
    id: 'mimo-v2-flash',
    displayName: 'MiMo-V2 Flash',
    description: 'MiMo-V2-Flash 是小米高效的推理模型，适用于推理、编码和 agent 基础任务。',
    type: 'chat',
    contextWindowTokens: 262_144,
    maxOutput: 65_536,
    enabled: true,
    abilities: {
      functionCall: true,
      reasoning: true,
    },
    pricing: {
      currency: 'CNY',
      input: 0.7,
      output: 2.1,
      cachedInput: 0.07,
    },
    releasedAt: '2025-12-16',
  },
];

const xiaomimimoTTSModels: TTSModelCard[] = [
  {
    id: 'mimo-v2-tts',
    displayName: 'MiMo-V2 TTS',
    description: 'MiMo-V2-TTS 是小米语音合成模型，支持高质量文本转语音。',
    type: 'tts',
    releasedAt: '2026-03-19',
  },
];

export default {
  chat: xiaomimimoChatModels,
  tts: xiaomimimoTTSModels,
};
