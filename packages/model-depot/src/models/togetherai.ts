import type { ChatModelCard, VideoModelCard } from '../types';

// ============================================================================
// Chat Models
// ============================================================================

const togetheraiChatModels: ChatModelCard[] = [
  {
    id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    displayName: 'Llama 3.3 70B Instruct Turbo',
    description: 'Meta Llama 3.3多语言大模型，优化多语言对话。',
    type: 'chat',
    contextWindowTokens: 131_072,
    enabled: true,
    abilities: {
      functionCall: true,
    },
  },
  {
    id: 'meta-llama/Llama-3.2-3B-Instruct-Turbo',
    displayName: 'Llama 3.2 3B Instruct Turbo',
    description: 'Llama 3.2轻量模型，处理视觉和文本数据任务。',
    type: 'chat',
    contextWindowTokens: 131_072,
    enabled: true,
  },
  {
    id: 'meta-llama/Llama-Vision-Free',
    displayName: 'Llama 3.2 11B Vision Instruct (Free)',
    description: 'Llama 3.2视觉模型免费版，图像描述和问答表现出色。',
    type: 'chat',
    contextWindowTokens: 131_072,
    enabled: true,
    abilities: {
      vision: true,
    },
  },
  {
    id: 'meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo',
    displayName: 'Llama 3.2 90B Vision Instruct Turbo',
    description: 'Llama 3.2大规模视觉模型，跨越视觉与语言推理。',
    type: 'chat',
    contextWindowTokens: 131_072,
    enabled: true,
    abilities: {
      vision: true,
    },
  },
  {
    id: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
    displayName: 'Llama 3.1 8B Instruct Turbo',
    description: 'Llama 3.1 8B量化版，适合复杂任务处理。',
    type: 'chat',
    contextWindowTokens: 131_072,
    enabled: true,
    abilities: {
      functionCall: true,
    },
  },
  {
    id: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
    displayName: 'Llama 3.1 70B Instruct Turbo',
    description: 'Llama 3.1 70B高效模型，适合高负载应用。',
    type: 'chat',
    contextWindowTokens: 131_072,
    enabled: true,
    abilities: {
      functionCall: true,
    },
  },
  {
    id: 'meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo',
    displayName: 'Llama 3.1 405B Instruct Turbo',
    description: 'Llama 3.1 405B超大规模模型，处理超大规模AI应用。',
    type: 'chat',
    contextWindowTokens: 130_815,
    enabled: true,
    abilities: {
      functionCall: true,
    },
  },
  {
    id: 'nvidia/Llama-3.1-Nemotron-70B-Instruct-HF',
    displayName: 'Llama 3.1 Nemotron 70B',
    description: 'NVIDIA定制大模型，对齐基准测试排名第一。',
    type: 'chat',
    contextWindowTokens: 32_768,
    enabled: true,
  },
  {
    id: 'deepseek-ai/DeepSeek-R1',
    displayName: 'DeepSeek R1',
    description: 'DeepSeek推理模型，强化学习优化，超越o1-mini。',
    type: 'chat',
    contextWindowTokens: 32_768,
    enabled: true,
    abilities: {
      reasoning: true,
    },
  },
  {
    id: 'deepseek-ai/DeepSeek-V3',
    displayName: 'DeepSeek V3',
    description: 'DeepSeek V3最新模型，性能对齐GPT-4o和Claude-3.5。',
    type: 'chat',
    contextWindowTokens: 16_384,
    enabled: true,
  },
  {
    id: 'Qwen/QwQ-32B-Preview',
    displayName: 'QwQ 32B Preview',
    description: 'Qwen实验性推理模型，专注增强AI推理能力。',
    type: 'chat',
    contextWindowTokens: 32_768,
    enabled: true,
    abilities: {
      reasoning: true,
    },
  },
  {
    id: 'Qwen/Qwen2.5-7B-Instruct-Turbo',
    displayName: 'Qwen 2.5 7B Instruct Turbo',
    description: 'Qwen2.5新版大模型，优化指令式任务处理。',
    type: 'chat',
    contextWindowTokens: 32_768,
    enabled: true,
  },
  {
    id: 'Qwen/Qwen2.5-72B-Instruct-Turbo',
    displayName: 'Qwen 2.5 72B Instruct Turbo',
    description: 'Qwen2.5 72B大规模模型，指令处理能力卓越。',
    type: 'chat',
    contextWindowTokens: 32_768,
    enabled: true,
  },
  {
    id: 'google/gemma-2-9b-it',
    displayName: 'Gemma 2 9B',
    description: 'Google Gemma 2 9B模型，高效指令响应。',
    type: 'chat',
    contextWindowTokens: 8192,
    enabled: true,
  },
  {
    id: 'google/gemma-2-27b-it',
    displayName: 'Gemma 2 27B',
    description: 'Google Gemma 2 27B通用模型，应用场景广泛。',
    type: 'chat',
    contextWindowTokens: 8192,
    enabled: true,
  },
  {
    id: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
    displayName: 'Mixtral 8x7B Instruct',
    description: 'Mixtral MoE模型，适合大规模数据处理。',
    type: 'chat',
    contextWindowTokens: 32_768,
    enabled: true,
    abilities: {
      functionCall: true,
    },
  },
  {
    id: 'mistralai/Mixtral-8x22B-Instruct-v0.1',
    displayName: 'Mixtral 8x22B Instruct',
    description: 'Mixtral超级大模型，支持极高处理需求。',
    type: 'chat',
    contextWindowTokens: 65_536,
    enabled: true,
  },
];

// ============================================================================
// Video Models
// ============================================================================

const togetheraiVideoModels: VideoModelCard[] = [
  // -------------------------------------------------------------------------
  // Tier 1 - Flagship Models (enabled: true)
  // -------------------------------------------------------------------------

  // Kuaishou Kling Models
  {
    id: 'kwaivgI/kling-2.1-master',
    displayName: 'Kling 2.1 Master',
    description: 'Kuaishou Kling 2.1 Master with highest quality output',
    type: 'video',
    enabled: true,
    maxDurationSeconds: 5,
    resolutions: ['1920x1080', '1080x1080', '1080x1920'],
    fps: 24,
    organization: 'Kuaishou',
    runtimeProvider: 'togetherai',
  },

  // -------------------------------------------------------------------------
  // Tier 2 - Production Models (enabled: true)
  // -------------------------------------------------------------------------

  {
    id: 'ByteDance/Seedance-1.0-pro',
    displayName: 'ByteDance Seedance 1.0 Pro',
    description: 'ByteDance professional video generation model',
    type: 'video',
    enabled: true,
    maxDurationSeconds: 5,
    resolutions: ['1280x720', '720x1280', '1024x1024'],
    fps: 24,
    organization: 'ByteDance',
    runtimeProvider: 'togetherai',
  },
  {
    id: 'kwaivgI/kling-2.1-pro',
    displayName: 'Kling 2.1 Pro',
    description: 'Kuaishou Kling 2.1 Pro with enhanced quality',
    type: 'video',
    enabled: true,
    maxDurationSeconds: 5,
    resolutions: ['1920x1080', '1080x1080', '1080x1920'],
    fps: 24,
    organization: 'Kuaishou',
    runtimeProvider: 'togetherai',
  },
  {
    id: 'vidu/vidu-2.0',
    displayName: 'Vidu 2.0',
    description: 'Vidu latest video generation model with 8s duration',
    type: 'video',
    enabled: true,
    maxDurationSeconds: 8,
    resolutions: ['1920x1080', '1080x1080', '1080x1920', '1280x720', '720x1280'],
    fps: 24,
    organization: 'Vidu',
    runtimeProvider: 'togetherai',
  },

  // -------------------------------------------------------------------------
  // Tier 3 - Standard Models (enabled: false)
  // -------------------------------------------------------------------------

  {
    id: 'ByteDance/Seedance-1.0-lite',
    displayName: 'ByteDance Seedance 1.0 Lite',
    description: 'ByteDance lightweight video generation model',
    type: 'video',
    enabled: false,
    maxDurationSeconds: 5,
    resolutions: ['1280x720', '720x1280', '1024x1024'],
    fps: 24,
    organization: 'ByteDance',
    runtimeProvider: 'togetherai',
  },
  {
    id: 'pixverse/pixverse-v5',
    displayName: 'PixVerse v5',
    description: 'PixVerse video generation model with stylized output',
    type: 'video',
    enabled: false,
    maxDurationSeconds: 5,
    resolutions: ['1280x720', '720x1280', '1024x1024'],
    fps: 24,
    organization: 'PixVerse',
    runtimeProvider: 'togetherai',
  },
  {
    id: 'kwaivgI/kling-2.1-standard',
    displayName: 'Kling 2.1 Standard',
    description: 'Kuaishou Kling 2.1 Standard quality tier',
    type: 'video',
    enabled: false,
    maxDurationSeconds: 5,
    resolutions: ['1920x1080', '1080x1080', '1080x1920'],
    fps: 24,
    organization: 'Kuaishou',
    runtimeProvider: 'togetherai',
  },
  {
    id: 'kwaivgI/kling-2.0-master',
    displayName: 'Kling 2.0 Master',
    description: 'Kuaishou Kling 2.0 Master previous generation',
    type: 'video',
    enabled: false,
    maxDurationSeconds: 5,
    resolutions: ['1280x720', '720x720', '720x1280'],
    fps: 24,
    organization: 'Kuaishou',
    runtimeProvider: 'togetherai',
  },
  {
    id: 'kwaivgI/kling-1.6-standard',
    displayName: 'Kling 1.6 Standard',
    description: 'Kuaishou Kling 1.6 Standard legacy model',
    type: 'video',
    enabled: false,
    maxDurationSeconds: 5,
    resolutions: ['1920x1080', '1080x1080', '1080x1920'],
    fps: 24,
    organization: 'Kuaishou',
    runtimeProvider: 'togetherai',
  },
  {
    id: 'kwaivgI/kling-1.6-pro',
    displayName: 'Kling 1.6 Pro',
    description: 'Kuaishou Kling 1.6 Pro legacy model',
    type: 'video',
    enabled: false,
    maxDurationSeconds: 5,
    resolutions: ['1920x1080', '1080x1080', '1080x1920'],
    fps: 24,
    organization: 'Kuaishou',
    runtimeProvider: 'togetherai',
  },
  {
    id: 'Wan-AI/Wan2.2-I2V-A14B',
    displayName: 'Wan 2.2 Image-to-Video',
    description: 'Wan-AI image-to-video generation model',
    type: 'video',
    enabled: false,
    organization: 'Wan-AI',
    runtimeProvider: 'togetherai',
  },
  {
    id: 'Wan-AI/Wan2.2-T2V-A14B',
    displayName: 'Wan 2.2 Text-to-Video',
    description: 'Wan-AI text-to-video generation model',
    type: 'video',
    enabled: false,
    organization: 'Wan-AI',
    runtimeProvider: 'togetherai',
  },
  {
    id: 'vidu/vidu-q1',
    displayName: 'Vidu Q1',
    description: 'Vidu Q1 quality-focused video generation',
    type: 'video',
    enabled: false,
    maxDurationSeconds: 5,
    resolutions: ['1920x1080', '1080x1080', '1080x1920'],
    fps: 24,
    organization: 'Vidu',
    runtimeProvider: 'togetherai',
  },
];

// ============================================================================
// Exports
// ============================================================================

export default {
  chat: togetheraiChatModels,
  video: togetheraiVideoModels,
};
