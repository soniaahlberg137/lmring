import type { ChatModelCard } from '../types';

const xiaomimimoChatModels: ChatModelCard[] = [
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

export default {
  chat: xiaomimimoChatModels,
};
