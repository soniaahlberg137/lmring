import type { ImageModelCard } from '../types';

const falImageModels: ImageModelCard[] = [
  {
    id: 'fal-ai/nano-banana',
    displayName: 'Nano Banana',
    description:
      'Nano Banana 是 Google 最新、最快、最高效的原生多模态模型，支持通过对话生成和编辑图像。',
    type: 'image',
    enabled: true,
    resolutions: ['1024x1024', '1536x1024', '1024x1536'],
    pricing: {
      input: 0.039,
    },
    releasedAt: '2025-08-26',
  },
  {
    id: 'fal-ai/bytedance/seedream/v4',
    displayName: 'Seedream 4.0',
    description:
      'Seedream 4.0 是字节跳动 Seed 的图像生成模型，支持文本和图像输入，具备高可控性和高质量图像生成能力。',
    type: 'image',
    enabled: true,
    resolutions: ['1024x1024', '2048x2048', '4096x4096'],
    pricing: {
      input: 0.03,
    },
    releasedAt: '2025-09-09',
  },
  {
    id: 'fal-ai/hunyuan-image/v3',
    displayName: 'HunyuanImage 3.0',
    description: '腾讯混元图像生成模型 3.0，是强大的原生多模态图像生成模型。',
    type: 'image',
    enabled: true,
    resolutions: ['1024x1024', '1536x1024', '1024x1536'],
    pricing: {
      input: 0.1,
    },
    releasedAt: '2025-09-28',
  },
  {
    id: 'fal-ai/flux-kontext/dev',
    displayName: 'FLUX.1 Kontext [dev]',
    description: 'FLUX.1 图像编辑模型，支持文本和图像输入。',
    type: 'image',
    enabled: true,
    resolutions: ['1024x1024', '1536x1024', '1024x1536'],
    pricing: {
      input: 0.025,
    },
    releasedAt: '2025-06-28',
  },
  {
    id: 'fal-ai/flux-pro/kontext',
    displayName: 'FLUX.1 Kontext [pro]',
    description:
      'FLUX.1 Kontext [pro] 接受文本和参考图像作为输入，支持针对性的局部编辑和复杂的全局场景变换。',
    type: 'image',
    enabled: true,
    resolutions: ['1024x1024', '1536x1024', '1024x1536'],
    pricing: {
      input: 0.04,
    },
    releasedAt: '2025-05-01',
  },
  {
    id: 'fal-ai/flux/schnell',
    displayName: 'FLUX.1 Schnell',
    description: 'FLUX.1 [schnell] 是 120 亿参数的图像生成模型，专为快速高质量输出而构建。',
    type: 'image',
    enabled: true,
    resolutions: ['512x512', '1024x1024', '1536x1536'],
    pricing: {
      input: 0.003,
    },
    releasedAt: '2024-08-01',
  },
  {
    id: 'fal-ai/flux/krea',
    displayName: 'FLUX.1 Krea [dev]',
    description: 'Flux Krea [dev] 是具有审美偏好的图像生成模型，倾向于更真实、自然的图像。',
    type: 'image',
    enabled: true,
    resolutions: ['512x512', '1024x1024', '2048x2048'],
    pricing: {
      input: 0.025,
    },
    releasedAt: '2025-07-31',
  },
  {
    id: 'fal-ai/imagen4/preview',
    displayName: 'Imagen 4',
    description: 'Google 的高质量图像生成模型。',
    type: 'image',
    enabled: true,
    organization: 'Deepmind',
    resolutions: ['1024x1024', '1792x1024', '1024x1792'],
    pricing: {
      input: 0.05,
    },
    releasedAt: '2025-05-21',
  },
  {
    id: 'fal-ai/qwen-image-edit',
    displayName: 'Qwen Edit',
    description:
      'Qwen 团队的专业图像编辑模型，支持语义和外观编辑、精确编辑中英文文本，以及风格迁移和物体旋转等高质量编辑。',
    type: 'image',
    enabled: true,
    resolutions: ['512x512', '1024x1024', '1536x1536'],
    pricing: {
      input: 0.03,
    },
    releasedAt: '2025-08-19',
  },
  {
    id: 'fal-ai/qwen-image',
    displayName: 'Qwen Image',
    description: 'Qwen 团队的强大图像生成模型，具有出色的中文文本渲染和多样化的视觉风格。',
    type: 'image',
    enabled: true,
    resolutions: ['512x512', '1024x1024', '1536x1536'],
    pricing: {
      input: 0.02,
    },
    releasedAt: '2025-08-04',
  },
];

export default {
  image: falImageModels,
};
