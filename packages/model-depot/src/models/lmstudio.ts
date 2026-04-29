import type { ChatModelCard } from '../types';

const lmstudioModels: ChatModelCard[] = [
  {
    id: 'llama3.1',
    displayName: 'Llama 3.1 8B',
    description:
      'Llama 3.1 is Meta’s leading model family, scaling up to 405B parameters for complex dialogue, multilingual translation, and data analysis.',
    type: 'chat',
    contextWindowTokens: 128_000,
    enabled: true,
  },
  {
    id: 'qwen2.5-14b-instruct',
    displayName: 'Qwen2.5 14B',
    description:
      "Qwen2.5 is Alibaba's next-generation large language model, delivering strong performance across diverse use cases.",
    type: 'chat',
    contextWindowTokens: 128_000,
    enabled: true,
  },
];

export default lmstudioModels;
