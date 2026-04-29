import type { ChatModelCard } from '../types';

const ai21Models: ChatModelCard[] = [
  {
    id: 'jamba-1.5-large',
    displayName: 'Jamba 1.5 Large',
    description:
      'Jamba 1.5 Large 是一款强大的指令调优模型，拥有 94B 激活参数和 398B 总参数，在长上下文处理方面表现出色。',
    type: 'chat',
    contextWindowTokens: 256_000,
    enabled: true,
    pricing: { input: 2, output: 8 },
  },
  {
    id: 'jamba-1.5-mini',
    displayName: 'Jamba 1.5 Mini',
    description:
      'Jamba 1.5 Mini 是一款紧凑高效的模型，拥有 12B 激活参数和 52B 总参数，在保持高质量输出的同时提供更快的推理速度。',
    type: 'chat',
    contextWindowTokens: 256_000,
    enabled: true,
    pricing: { input: 0.2, output: 0.4 },
  },
  {
    id: 'jamba-mini',
    displayName: 'Jamba Mini',
    description: 'Jamba Mini 是一款轻量级模型，专为快速响应和高效推理设计。',
    type: 'chat',
    contextWindowTokens: 256_000,
    enabled: true,
    abilities: { functionCall: true },
    pricing: { input: 0.2, output: 0.4 },
    releasedAt: '2025-03-06',
  },
  {
    id: 'jamba-large',
    displayName: 'Jamba Large',
    description:
      'Our most powerful, advanced model, designed for complex enterprise tasks with outstanding performance.',
    type: 'chat',
    contextWindowTokens: 256_000,
    enabled: true,
    abilities: { functionCall: true },
    pricing: { input: 2, output: 8 },
    releasedAt: '2025-03-06',
  },
];

export default ai21Models;
