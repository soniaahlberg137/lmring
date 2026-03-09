import type { ImageModelCard } from '../types';

const bflImageModels: ImageModelCard[] = [
  {
    description: 'FLUX.1 Pro 是 Black Forest Labs 的旗舰图像生成模型，提供最高质量的图像生成能力。',
    displayName: 'FLUX.1 Pro',
    enabled: true,
    id: 'flux-pro-1.1',
    pricing: {
      input: 0.04,
      unit: 'requests',
    },
    type: 'image',
  },
  {
    description: 'FLUX.1 Pro Ultra 提供超高分辨率的图像生成，适合专业创作场景。',
    displayName: 'FLUX.1 Pro Ultra',
    id: 'flux-pro-1.1-ultra',
    pricing: {
      input: 0.06,
      unit: 'requests',
    },
    type: 'image',
  },
  {
    description: 'FLUX.1 Dev 是开发者版本，提供优秀的性价比。',
    displayName: 'FLUX.1 Dev',
    enabled: true,
    id: 'flux-dev',
    pricing: {
      input: 0.025,
      unit: 'requests',
    },
    type: 'image',
  },
  {
    description: 'FLUX.1 Schnell 是快速版本，提供最快的生成速度。',
    displayName: 'FLUX.1 Schnell',
    id: 'flux-schnell',
    pricing: {
      input: 0.003,
      unit: 'requests',
    },
    type: 'image',
  },
  {
    description: 'FLUX.1 Fill 专注于图像修复和填充任务。',
    displayName: 'FLUX.1 Fill',
    id: 'flux-pro-1.0-fill',
    pricing: {
      input: 0.05,
      unit: 'requests',
    },
    type: 'image',
  },
  {
    description: 'FLUX.1 Canny 支持基于边缘检测的图像生成控制。',
    displayName: 'FLUX.1 Canny',
    id: 'flux-pro-1.0-canny',
    pricing: {
      input: 0.05,
      unit: 'requests',
    },
    type: 'image',
  },
  {
    description: 'FLUX.1 Depth 支持基于深度图的图像生成控制。',
    displayName: 'FLUX.1 Depth',
    id: 'flux-pro-1.0-depth',
    pricing: {
      input: 0.05,
      unit: 'requests',
    },
    type: 'image',
  },
];

export const allModels = [...bflImageModels];

export default allModels;
