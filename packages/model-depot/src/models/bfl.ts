import type { ImageModelCard } from '../types';

const bflModels: ImageModelCard[] = [
  {
    id: 'flux-pro-1.1',
    displayName: 'FLUX.1 Pro',
    description: 'FLUX.1 Pro 是 Black Forest Labs 的旗舰图像生成模型，提供最高质量的图像生成能力。',
    type: 'image',
    enabled: true,
    pricing: { input: 0.04 },
    releasedAt: '2024-10-02',
  },
  {
    id: 'flux-pro-1.1-ultra',
    displayName: 'FLUX.1 Pro Ultra',
    description: 'FLUX.1 Pro Ultra 提供超高分辨率的图像生成，适合专业创作场景。',
    type: 'image',
    enabled: true,
    pricing: { input: 0.06 },
    releasedAt: '2024-11-06',
  },
  {
    id: 'flux-dev',
    displayName: 'FLUX.1 Dev',
    description: 'FLUX.1 Dev 是开发者版本，提供优秀的性价比。',
    type: 'image',
    enabled: true,
    pricing: { input: 0.025 },
    releasedAt: '2024-08-01',
  },
  {
    id: 'flux-schnell',
    displayName: 'FLUX.1 Schnell',
    description: 'FLUX.1 Schnell 是快速版本，提供最快的生成速度。',
    type: 'image',
    pricing: { input: 0.003 },
  },
  {
    id: 'flux-pro-1.0-fill',
    displayName: 'FLUX.1 Fill',
    description: 'FLUX.1 Fill 专注于图像修复和填充任务。',
    type: 'image',
    pricing: { input: 0.05 },
  },
  {
    id: 'flux-pro-1.0-canny',
    displayName: 'FLUX.1 Canny',
    description: 'FLUX.1 Canny 支持基于边缘检测的图像生成控制。',
    type: 'image',
    pricing: { input: 0.05 },
  },
  {
    id: 'flux-pro-1.0-depth',
    displayName: 'FLUX.1 Depth',
    description: 'FLUX.1 Depth 支持基于深度图的图像生成控制。',
    type: 'image',
    pricing: { input: 0.05 },
  },
  {
    id: 'flux-kontext-pro',
    displayName: 'FLUX.1 Kontext [pro]',
    description:
      'State-of-the-art contextual image generation and editing, combining text and images for precise, coherent results.',
    type: 'image',
    enabled: true,
    releasedAt: '2025-05-29',
  },
  {
    id: 'flux-kontext-max',
    displayName: 'FLUX.1 Kontext [max]',
    description:
      'State-of-the-art contextual image generation and editing, combining text and images for precise, coherent results.',
    type: 'image',
    enabled: true,
    releasedAt: '2025-05-29',
  },
  {
    id: 'flux-pro',
    displayName: 'FLUX.1 [pro]',
    description:
      'Top-tier commercial image generation model with unmatched image quality and diverse outputs.',
    type: 'image',
    enabled: true,
    releasedAt: '2024-08-01',
  },
];

export default bflModels;
