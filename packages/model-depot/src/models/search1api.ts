import type { ChatModelCard } from '../types';

const search1apiModels: ChatModelCard[] = [
  {
    id: 'deepseek-r1-70b-fast-online',
    displayName: 'DeepSeek R1 70B Fast Online',
    description:
      'DeepSeek R1 70B Fast Online 是一款带有联网能力的快速推理模型，可根据需要自动搜索网络获取最新信息。',
    type: 'chat',
    contextWindowTokens: 131_072,
    maxOutput: 16_384,
    enabled: true,
    abilities: { reasoning: true, search: true },
    settings: { searchImpl: 'internal' },
  },
  {
    id: 'deepseek-r1-online',
    displayName: 'DeepSeek R1 Online',
    description: 'DeepSeek R1 Online 是带有联网功能的完整推理模型。',
    type: 'chat',
    contextWindowTokens: 65_536,
    maxOutput: 8_192,
    enabled: true,
    abilities: { reasoning: true, search: true },
    settings: { searchImpl: 'internal' },
  },
  {
    id: 'deepseek-v3-online',
    displayName: 'DeepSeek V3 Online',
    description: 'DeepSeek V3 Online 是带有联网功能的高性能通用模型。',
    type: 'chat',
    contextWindowTokens: 65_536,
    abilities: { search: true },
    settings: { searchImpl: 'internal' },
  },
  {
    id: 'deepseek-r1-70b-online',
    displayName: 'DeepSeek R1 70B',
    description:
      'DeepSeek R1 70B standard edition with real-time web search, suited for up-to-date chat and text tasks.',
    type: 'chat',
    contextWindowTokens: 131_072,
    maxOutput: 16_384,
    enabled: true,
    abilities: { reasoning: true, search: true },
  },
  {
    id: 'deepseek-r1-fast-online',
    displayName: 'DeepSeek R1 Fast',
    description:
      'DeepSeek R1 fast full version with real-time web search, combining 671B-scale capability and faster response.',
    type: 'chat',
    contextWindowTokens: 163_840,
    maxOutput: 16_384,
    enabled: true,
    abilities: { reasoning: true, search: true },
  },
];

export default search1apiModels;
