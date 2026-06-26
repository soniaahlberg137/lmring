/**
 * ZeroEval API Service Layer
 * API Documentation: https://api.zeroeval.com/
 *
 */

// Arena names for Code Arena calculation (includes all code-related arenas)
const CODE_ARENA_KEYS = [
  'text-to-website',
  'threejs',
  'text-to-game',
  'p5-animation',
  'text-to-svg',
  'dataviz',
  'tonejs',
] as const;

// All arena names for LLM API request
const ALL_ARENA_NAMES = ['chat-arena', ...CODE_ARENA_KEYS] as const;

// Arena names for each category
export const CATEGORY_ARENA_NAMES = {
  text: ALL_ARENA_NAMES,
  vision: ALL_ARENA_NAMES,
  'image-generation': ['text-to-image', 'image-to-image'] as const,
  'video-generation': ['text-to-video', 'image-to-video', 'video-editing'] as const,
  'text-to-speech': ['text-to-speech'] as const,
  'speech-to-text': ['speech-to-text'] as const,
  all: ALL_ARENA_NAMES,
} as const;

// ============================================================================
// Type Definitions
// ============================================================================

export interface ZeroEvalModelBasic {
  model_id: string;
  name: string;
  model_type: 'llm' | 'image' | 'video' | 'tts' | 'stt';
  organization: string;
  organization_id: string;
  announcement_date: string;
  release_date: string | null;
  multimodal: boolean;
  license: string;
  is_open: boolean;
  input_modalities: string[];
  output_modalities: string[];
}

export interface ZeroEvalModelFull {
  model_id: string;
  name: string;
  organization: string;
  organization_id: string;
  organization_country: string | null;
  params: number | null;
  training_tokens: number | null;
  context: number | null;
  canonical_model_id: string | null;
  is_moe: boolean | null;
  release_date: string | null;
  announcement_date: string;
  multimodal: boolean;
  license: string | null;
  knowledge_cutoff: string | null;
  input_price: string | null;
  output_price: string | null;
  throughput: string | null;
  latency: string | null;
  // Benchmark scores — real ZeroEval fields only
  aime_2025_score: number | null;
  hle_score: number | null;
  gpqa_score: number | null;
  swe_bench_verified_score: number | null;
  mmmu_score: number | null;
  simpleqa_score: number | null;
  osworld_score: number | null;
  browsecomp_score: number | null;
  toolathlon_score: number | null;
  terminal_bench_score: number | null;
  tau_bench_retail_score: number | null;
  arc_agi_v2_score: number | null;
  mmmlu_score: number | null;
  charxiv_r_score: number | null;
  mmmu_pro_score: number | null;
  screenspot_pro_score: number | null;
  mcp_atlas_score: number | null;
  frontiermath_score: number | null;
  mrcr_v2_score: number | null;
  scicode_score: number | null;
  apex_agents_score: number | null;
  swe_bench_pro_score: number | null;
}

export interface ZeroEvalBenchmark {
  benchmark_id: string;
  name: string;
  description: string;
  categories: string[];
  modality: 'text' | 'image' | 'video' | 'audio' | 'multimodal';
  max_score: number;
  verified: boolean;
  model_count: number;
}

export interface ZeroEvalModelDetail {
  model_id: string;
  name: string;
  organization: {
    id: string;
    name: string;
    website: string;
  };
  description: string;
  release_date: string | null;
  announcement_date: string;
  multimodal: boolean;
  knowledge_cutoff: string | null;
  param_count: number | null;
  training_tokens: number | null;
  available_in_zeroeval: boolean;
  reviews_count: number;
  reviews_avg_rating: number;
  license: {
    name: string;
    allow_commercial: boolean;
  };
  model_family: string | null;
  fine_tuned_from: string | null;
  tags: Record<string, string>;
  sources: {
    api_ref: string | null;
    playground: string | null;
    paper: string | null;
    scorecard_blog: string | null;
    repo: string | null;
    weights: string | null;
  };
  benchmarks: ZeroEvalBenchmarkScore[];
}

export interface ZeroEvalBenchmarkScore {
  benchmark_id: string;
  name: string;
  description: string;
  categories: string[];
  modality: string;
  max_score: number;
  score: number;
  normalized_score: number;
  verified: boolean;
  self_reported: boolean;
  self_reported_source: string | null;
  analysis_method: string | null;
  verification_date: string | null;
  verification_notes: string | null;
}

// ============================================================================
// Magia Leaderboard Types (from /magia/arenas/{arena}/leaderboard API)
// ============================================================================

export interface MagiaLeaderboardItem {
  variant_id: string;
  variant_key: string;
  model_id: string;
  model_name: string;
  organization: string;
  mu: number;
  sigma: number;
  conservative_rating: number;
  matches_played: number;
  wins: number;
  win_rate: number;
  input_price: number | null;
  output_price: number | null;
  avg_generation_price: number | null;
  announcement_date: string;
  license: string;
  is_open_source: boolean;
}

export interface MagiaLeaderboardResponse {
  leaderboard: MagiaLeaderboardItem[];
  total_count: number;
  limit: number;
  offset: number;
}

// ============================================================================
// Arena Scores Types (from /magia/models/scores API)
// ============================================================================

export interface ArenaScores {
  // LLM arenas
  'chat-arena'?: number;
  'text-to-website'?: number;
  threejs?: number;
  'text-to-game'?: number;
  'p5-animation'?: number;
  'text-to-svg'?: number;
  dataviz?: number;
  tonejs?: number;
  // Non-LLM arenas
  'text-to-image'?: number;
  'image-to-image'?: number;
  'text-to-video'?: number;
  'image-to-video'?: number;
  'video-editing'?: number;
  'text-to-speech'?: number;
  'speech-to-text'?: number;
}

export type ArenaScoresResponse = Record<string, ArenaScores>;

// ============================================================================
// Query Parameters
// ============================================================================

export type ModelType = 'llm' | 'image' | 'video' | 'tts' | 'stt';
export type Modality = 'text' | 'image' | 'video' | 'audio';

export interface ModelsAllParams {
  model_type?: ModelType;
  input_modality?: Modality;
  output_modality?: Modality;
}

// ============================================================================
// Leaderboard Category Configuration
// ============================================================================

export type LeaderboardCategory =
  // TODO: Re-enable when text interface price adjustment is correct
  // | 'text'
  'vision' | 'image-generation' | 'video-generation' | 'text-to-speech' | 'speech-to-text' | 'all';

export interface CategoryConfig {
  id: LeaderboardCategory;
  label: string;
  icon: string;
  apiParams: ModelsAllParams;
  metrics: MetricConfig[];
}

export interface MetricConfig {
  id: string;
  label: string;
  field: keyof ZeroEvalModelFull | string;
  format: 'number' | 'percentage' | 'currency' | 'context';
  higherIsBetter: boolean;
}

export const CATEGORY_CONFIGS: CategoryConfig[] = [
  {
    id: 'all',
    label: 'All',
    icon: 'LayoutGrid',
    apiParams: {},
    metrics: [
      {
        id: 'gaia',
        label: 'GAIA',
        field: 'gaia_score',
        format: 'percentage',
        higherIsBetter: true,
      },
      {
        id: 'gsm8k',
        label: 'GSM8K',
        field: 'gsm8k_score',
        format: 'percentage',
        higherIsBetter: true,
      },
      {
        id: 'mmlu',
        label: 'MMLU',
        field: 'mmlu_score',
        format: 'percentage',
        higherIsBetter: true,
      },
      {
        id: 'pubmedqa',
        label: 'PubMedQA',
        field: 'pubmedqa_score',
        format: 'percentage',
        higherIsBetter: true,
      },
      {
        id: 'swe_bench',
        label: 'SWE-bench',
        field: 'swe_bench_verified_score',
        format: 'percentage',
        higherIsBetter: true,
      },
      {
        id: 'tau_bench',
        label: 'tau-bench',
        field: 'tau_bench_score',
        format: 'percentage',
        higherIsBetter: true,
      },
      {
        id: 'core_bench',
        label: 'CORE-bench',
        field: 'core_bench_score',
        format: 'percentage',
        higherIsBetter: true,
      },
      {
        id: 'context',
        label: 'Context',
        field: 'context',
        format: 'context',
        higherIsBetter: true,
      },
      {
        id: 'input_price',
        label: 'Input $/M',
        field: 'input_price',
        format: 'currency',
        higherIsBetter: false,
      },
      {
        id: 'output_price',
        label: 'Output $/M',
        field: 'output_price',
        format: 'currency',
        higherIsBetter: false,
      },
    ],
  },
  {
    id: 'vision',
    label: 'Vision',
    icon: 'Eye',
    apiParams: { input_modality: 'image', output_modality: 'text' },
    metrics: [
      {
        id: 'mmmu',
        label: 'MMMU',
        field: 'mmmu_score',
        format: 'percentage',
        higherIsBetter: true,
      },
      {
        id: 'gpqa',
        label: 'GPQA',
        field: 'gpqa_score',
        format: 'percentage',
        higherIsBetter: true,
      },
      {
        id: 'context',
        label: 'Context',
        field: 'context',
        format: 'context',
        higherIsBetter: true,
      },
      {
        id: 'input_price',
        label: 'Input $/M',
        field: 'input_price',
        format: 'currency',
        higherIsBetter: false,
      },
      {
        id: 'output_price',
        label: 'Output $/M',
        field: 'output_price',
        format: 'currency',
        higherIsBetter: false,
      },
    ],
  },
  {
    id: 'image-generation',
    label: 'Image Generation',
    icon: 'Image',
    apiParams: { output_modality: 'image' },
    metrics: [
      {
        id: 'text_to_image',
        label: 'Image Gen',
        field: 'text-to-image',
        format: 'number',
        higherIsBetter: true,
      },
      {
        id: 'image_to_image',
        label: 'Image Edit',
        field: 'image-to-image',
        format: 'number',
        higherIsBetter: true,
      },
      {
        id: 'input_price',
        label: 'Input $/M',
        field: 'input_price',
        format: 'currency',
        higherIsBetter: false,
      },
      {
        id: 'output_price',
        label: 'Output $/M',
        field: 'output_price',
        format: 'currency',
        higherIsBetter: false,
      },
    ],
  },
  {
    id: 'video-generation',
    label: 'Video Generation',
    icon: 'Video',
    apiParams: { output_modality: 'video' },
    metrics: [
      {
        id: 'text_to_video',
        label: 'Video Gen',
        field: 'text-to-video',
        format: 'number',
        higherIsBetter: true,
      },
      {
        id: 'image_to_video',
        label: 'Image to Video',
        field: 'image-to-video',
        format: 'number',
        higherIsBetter: true,
      },
      {
        id: 'video_editing',
        label: 'Video Edit',
        field: 'video-editing',
        format: 'number',
        higherIsBetter: true,
      },
      {
        id: 'input_price',
        label: 'Input $/M',
        field: 'input_price',
        format: 'currency',
        higherIsBetter: false,
      },
      {
        id: 'output_price',
        label: 'Output $/M',
        field: 'output_price',
        format: 'currency',
        higherIsBetter: false,
      },
    ],
  },
  {
    id: 'text-to-speech',
    label: 'Text-to-Speech',
    icon: 'Volume2',
    apiParams: { input_modality: 'text', output_modality: 'audio' },
    metrics: [
      {
        id: 'text_to_speech',
        label: 'TTS Arena',
        field: 'text-to-speech',
        format: 'number',
        higherIsBetter: true,
      },
      {
        id: 'input_price',
        label: 'Input $/M',
        field: 'input_price',
        format: 'currency',
        higherIsBetter: false,
      },
      {
        id: 'output_price',
        label: 'Output $/M',
        field: 'output_price',
        format: 'currency',
        higherIsBetter: false,
      },
    ],
  },
  {
    id: 'speech-to-text',
    label: 'Speech-to-Text',
    icon: 'Mic',
    apiParams: { input_modality: 'audio', output_modality: 'text' },
    metrics: [
      {
        id: 'speech_to_text',
        label: 'STT Arena',
        field: 'speech-to-text',
        format: 'number',
        higherIsBetter: true,
      },
      {
        id: 'input_price',
        label: 'Input $/M',
        field: 'input_price',
        format: 'currency',
        higherIsBetter: false,
      },
      {
        id: 'output_price',
        label: 'Output $/M',
        field: 'output_price',
        format: 'currency',
        higherIsBetter: false,
      },
    ],
  },
];

// ============================================================================
// Data Processing Utilities
// ============================================================================

/**
 * Format a metric value for display
 */
export function formatMetricValue(
  value: string | number | null | undefined,
  format: MetricConfig['format'],
): string {
  if (value === null || value === undefined || value === '') {
    return '—';
  }

  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (Number.isNaN(numValue)) {
    return '—';
  }

  switch (format) {
    case 'percentage':
      return `${(numValue * 100).toFixed(1)}%`;
    case 'currency':
      return `$${numValue.toFixed(2)}`;
    case 'context':
      if (numValue >= 1000000) {
        return `${(numValue / 1000000).toFixed(1)}M`;
      }
      if (numValue >= 1000) {
        return `${(numValue / 1000).toFixed(0)}K`;
      }
      return numValue.toString();
    default:
      // Display numbers with 2 decimal places (for arena scores etc.)
      return numValue.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
  }
}

/**
 * Get raw numeric value for sorting
 */
export function getNumericValue(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === '') {
    return -Infinity;
  }
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return Number.isNaN(numValue) ? -Infinity : numValue;
}

/**
 * Check if a model was released recently (within 30 days)
 */
export function isNewModel(releaseDate: string | null, announcementDate: string): boolean {
  const dateStr = releaseDate || announcementDate;
  if (!dateStr) return false;

  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);

  return diffDays <= 30;
}

/**
 * Sort models by a specific field
 */
export function sortModels<T>(models: T[], field: string, direction: 'asc' | 'desc' = 'desc'): T[] {
  return [...models].sort((a, b) => {
    const aVal = getNumericValue((a as Record<string, unknown>)[field] as string | number | null);
    const bVal = getNumericValue((b as Record<string, unknown>)[field] as string | number | null);

    // Push null/undefined values to the end
    if (aVal === -Infinity && bVal === -Infinity) return 0;
    if (aVal === -Infinity) return 1;
    if (bVal === -Infinity) return -1;

    return direction === 'desc' ? bVal - aVal : aVal - bVal;
  });
}

export function sortAndRankModels<T>(
  models: T[],
  field: string,
  direction: 'asc' | 'desc' = 'desc',
): Array<T & { rank: number }> {
  return sortModels(models, field, direction).map((model, index) => ({
    ...model,
    rank: index + 1,
  }));
}

export function getOrganizationColor(organizationId: string): string {
  const colors: Record<string, string> = {
    openai: '#10B981',
    anthropic: '#F59E0B',
    google: '#3B82F6',
    meta: '#8B5CF6',
    mistral: '#F97316',
    deepseek: '#06B6D4',
    xai: '#EC4899',
    cohere: '#EF4444',
    'zai-org': '#14B8A6',
    zhipu: '#14B8A6',
    minimax: '#A855F7',
    xiaomi: '#FB923C',
    bytedance: '#22D3D3',
    tencent: '#38BDF8',
    hunyuan: '#38BDF8',
    qwen: '#818CF8',
    moonshot: '#C084FC',
    'moonshot-ai': '#C084FC',
    kimi: '#C084FC',
    baidu: '#2563EB',
    ernie: '#2563EB',
    '01-ai': '#34D399',
    yi: '#34D399',
    nvidia: '#84CC16',
    amazon: '#FBBF24',
    aws: '#FBBF24',
    microsoft: '#60A5FA',
    azure: '#60A5FA',
    'black-forest-labs': '#A78BFA',
    flux: '#A78BFA',
    luma: '#818CF8',
    elevenlabs: '#F472B6',
    stability: '#FB7185',
    midjourney: '#4ADE80',
    runway: '#2DD4BF',
    'recraft-ai': '#C084FC',
    together: '#F87171',
    groq: '#FCD34D',
    perplexity: '#22D3EE',
    replicate: '#A3E635',
  };

  return colors[organizationId.toLowerCase()] || '#94A3B8';
}

/**
 * Get a gradient color pair for more visual interest in charts
 * Returns [startColor, endColor] for gradient fills
 */
export function getOrganizationGradient(organizationId: string): [string, string] {
  const gradients: Record<string, [string, string]> = {
    openai: ['#10B981', '#059669'],
    anthropic: ['#F59E0B', '#D97706'],
    google: ['#3B82F6', '#2563EB'],
    meta: ['#8B5CF6', '#7C3AED'],
    mistral: ['#F97316', '#EA580C'],
    deepseek: ['#06B6D4', '#0891B2'],
    xai: ['#EC4899', '#DB2777'],
  };

  const baseColor = getOrganizationColor(organizationId);
  return gradients[organizationId.toLowerCase()] || [baseColor, baseColor];
}
