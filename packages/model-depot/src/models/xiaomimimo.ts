import type { ChatModelCard, TTSModelCard } from '../types';

const xiaomimimoChatModels: ChatModelCard[] = [
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
      currency: 'USD',
      input: 1,
      output: 3,
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
      currency: 'USD',
      input: 0.4,
      output: 2,
    },
    releasedAt: '2026-03-19',
  },
  {
    id: 'mimo-v2-flash',
    displayName: 'MiMo-V2 Flash',
    description: 'MiMo-V2-Flash 是小米高效的推理模型，适用于推理、编码和 agent 基础任务。',
    type: 'chat',
    contextWindowTokens: 262_144,
    maxOutput: 131_072,
    enabled: true,
    abilities: {
      functionCall: true,
      reasoning: true,
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
