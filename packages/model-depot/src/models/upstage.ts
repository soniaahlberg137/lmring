import type { ChatModelCard } from '../types';

const upstageModels: ChatModelCard[] = [
  {
    id: 'solar-pro',
    displayName: 'Solar Pro',
    description: 'Upstage Solar Pro大语言模型，性能出色。',
    type: 'chat',
    contextWindowTokens: 32_768,
    enabled: true,
    abilities: { functionCall: true },
    pricing: { input: 0.25, output: 0.25 },
    releasedAt: '2024-11-26',
  },
  {
    id: 'solar-mini',
    displayName: 'Solar Mini',
    description: 'Upstage Solar Mini轻量模型，快速响应。',
    type: 'chat',
    contextWindowTokens: 32_768,
    enabled: true,
    abilities: { functionCall: true },
    pricing: { input: 0.15, output: 0.15 },
    releasedAt: '2025-01-23',
  },
  {
    id: 'solar-mini-ja',
    displayName: 'Solar Mini (Ja)',
    description:
      'Solar Mini (Ja) extends Solar Mini with a focus on Japanese while maintaining efficient, strong performance in English and Korean.',
    type: 'chat',
    contextWindowTokens: 32_768,
    releasedAt: '2025-01-23',
  },
];

export default upstageModels;
