import type { ChatModelCard, ImageModelCard, VideoModelCard } from '../types';

// ============================================================================
// Chat Models
// ============================================================================

const minimaxChatModels: ChatModelCard[] = [
  {
    id: 'MiniMax-M2',
    displayName: 'MiniMax M2',
    description: '专为高效编码与Agent工作流而生',
    type: 'chat',
    contextWindowTokens: 204_800,
    maxOutput: 131_072,
    enabled: true,
    abilities: {
      functionCall: true,
      reasoning: true,
    },
    pricing: {
      input: 2.1,
      output: 8.4,
      cachedInput: 0.21,
      currency: 'CNY',
    },
    releasedAt: '2025-10-27',
  },
  {
    id: 'MiniMax-M2-Stable',
    displayName: 'MiniMax M2 Stable',
    description: '专为高效编码与Agent工作流而生，更高并发，商业使用。',
    type: 'chat',
    contextWindowTokens: 204_800,
    maxOutput: 131_072,
    abilities: {
      functionCall: true,
      reasoning: true,
    },
    pricing: {
      input: 2.1,
      output: 8.4,
      cachedInput: 0.21,
      currency: 'CNY',
    },
    releasedAt: '2025-10-27',
  },
  {
    id: 'MiniMax-M1',
    displayName: 'MiniMax M1',
    description: '全新自研推理模型。全球领先：80K 思维链 x 1M 输入，效果比肩海外顶尖模型',
    type: 'chat',
    contextWindowTokens: 1_000_192,
    maxOutput: 40_000,
    enabled: true,
    abilities: {
      functionCall: true,
      reasoning: true,
    },
    pricing: {
      input: 1.2,
      output: 16,
      currency: 'CNY',
    },
    releasedAt: '2025-06-16',
  },
  {
    id: 'MiniMax-Text-01',
    displayName: 'MiniMax Text 01',
    description:
      '在 MiniMax-01系列模型中，我们做了大胆创新：首次大规模实现线性注意力机制，传统 Transformer架构不再是唯一的选择。这个模型的参数量高达4560亿，其中单次激活459亿。模型综合性能比肩海外顶尖模型，同时能够高效处理全球最长400万token的上下文，是GPT-4o的32倍，Claude-3.5-Sonnet的20倍。',
    type: 'chat',
    contextWindowTokens: 1_000_192,
    maxOutput: 40_000,
    abilities: {
      functionCall: true,
      vision: true,
    },
    pricing: {
      input: 1,
      output: 8,
      currency: 'CNY',
    },
    releasedAt: '2025-01-15',
  },
];

// ============================================================================
// Image Models
// ============================================================================

const minimaxImageModels: ImageModelCard[] = [
  {
    id: 'image-01',
    displayName: 'Image 01',
    description: '全新图像生成模型，画面表现细腻，支持文生图、图生图',
    type: 'image',
    enabled: true,
    releasedAt: '2025-02-28',
    resolutions: ['1:1', '16:9', '4:3', '3:2', '2:3', '3:4', '9:16', '21:9'],
  },
  {
    id: 'image-01-live',
    displayName: 'Image 01 Live',
    description: '图像生成模型，画面表现细腻，支持文生图并进行画风设置',
    type: 'image',
    enabled: true,
    releasedAt: '2025-02-28',
    resolutions: ['1:1', '16:9', '4:3', '3:2', '2:3', '3:4', '9:16', '21:9'],
  },
];

// ============================================================================
// Video Models
// ============================================================================

const minimaxVideoModels: VideoModelCard[] = [
  {
    id: 'minimax/hailuo-02',
    displayName: 'MiniMax Hailuo 02',
    description: 'MiniMax latest video model with 10s duration and HD support',
    type: 'video',
    enabled: true,
    abilities: { videoOutput: true },
    maxDurationSeconds: 10,
    resolutions: ['1366x768', '1920x1080'],
    fps: 25,
    organization: 'MiniMax',
    runtimeProvider: 'minimax',
  },
  {
    id: 'minimax/video-01-director',
    displayName: 'MiniMax Video-01 Director',
    description: 'MiniMax video model with camera movement control',
    type: 'video',
    enabled: true,
    abilities: { videoOutput: true },
    maxDurationSeconds: 5,
    resolutions: ['1366x768'],
    fps: 25,
    organization: 'MiniMax',
    runtimeProvider: 'minimax',
  },
];

// ============================================================================
// Exports
// ============================================================================

export default {
  chat: minimaxChatModels,
  image: minimaxImageModels,
  video: minimaxVideoModels,
};
