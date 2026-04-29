import type { ChatModelCard } from '../types';

const jinaModels: ChatModelCard[] = [
  {
    id: 'jina-deepsearch-v1',
    displayName: 'Jina DeepSearch V1',
    description:
      'Jina DeepSearch V1 是一款专为深度搜索设计的模型，能够进行多轮搜索和推理，提供全面准确的答案。',
    type: 'chat',
    contextWindowTokens: 1_000_000,
    enabled: true,
    abilities: { search: true },
    pricing: { input: 0.02, output: 0.02 },
    settings: { searchImpl: 'internal' },
  },
];

export default jinaModels;
