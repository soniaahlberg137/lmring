/**
 * ZeroEval API Service Layer
 * API Documentation: https://api.zeroeval.com/
 *
 */

const ZEROEVAL_BASE_URL = '/api/zeroeval';

// Arena names for Code Arena calculation (excludes chat-arena and tonejs)
const CODE_ARENA_KEYS = [
  'text-to-website',
  'threejs',
  'text-to-game',
  'p5-animation',
  'text-to-svg',
  'dataviz',
] as const;

// All arena names for LLM API request
const ALL_ARENA_NAMES = ['chat-arena', ...CODE_ARENA_KEYS, 'tonejs'] as const;

// Arena names for each category
export const CATEGORY_ARENA_NAMES = {
  llm: ALL_ARENA_NAMES,
  vision: ALL_ARENA_NAMES,
  'image-generation': ['text-to-image', 'image-to-image'] as const,
  'video-generation': ['text-to-video', 'image-to-video', 'video-editing'] as const,
  'text-to-speech': ['text-to-speech'] as const,
  'speech-to-text': ['speech-to-text'] as const,
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
  organization_country: string;
  params: number | null;
  context: number | null;
  canonical_model_id: string | null;
  release_date: string | null;
  announcement_date: string;
  multimodal: boolean;
  license: string;
  knowledge_cutoff: string | null;
  input_price: string | null;
  output_price: string | null;
  throughput: string | null;
  latency: string | null;
  // Benchmark scores
  aime_2025_score: number | null;
  hle_score: number | null;
  gpqa_score: number | null;
  swe_bench_verified_score: number | null;
  mmmu_score: number | null;
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
  | 'llm'
  | 'vision'
  | 'image-generation'
  | 'video-generation'
  | 'text-to-speech'
  | 'speech-to-text';

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
    id: 'llm',
    label: 'LLM',
    icon: 'MessageSquare',
    apiParams: { model_type: 'llm' },
    metrics: [
      {
        id: 'gpqa',
        label: 'GPQA',
        field: 'gpqa_score',
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
        id: 'code_arena',
        label: 'Code Arena',
        field: 'code_arena_score',
        format: 'number',
        higherIsBetter: true,
      },
      {
        id: 'chat_arena',
        label: 'Chat Arena',
        field: 'chat_arena_score',
        format: 'number',
        higherIsBetter: true,
      },
      {
        id: 'mmmu',
        label: 'MMMU',
        field: 'mmmu_score',
        format: 'percentage',
        higherIsBetter: true,
      },
      {
        id: 'aime',
        label: 'AIME 2025',
        field: 'aime_2025_score',
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
// API Fetch Functions
// ============================================================================

async function fetchWithRetry<T>(url: string, options: RequestInit = {}, retries = 3): Promise<T> {
  let lastError: Error | null = null;

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (i < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }

  throw lastError || new Error('Failed to fetch');
}

/**
 * Get all models with basic info
 */
export async function getModelsAll(params?: ModelsAllParams): Promise<ZeroEvalModelBasic[]> {
  const searchParams = new URLSearchParams();

  if (params?.model_type) {
    searchParams.set('model_type', params.model_type);
  }
  if (params?.input_modality) {
    searchParams.set('input_modality', params.input_modality);
  }
  if (params?.output_modality) {
    searchParams.set('output_modality', params.output_modality);
  }

  const queryString = searchParams.toString();
  const url = `${ZEROEVAL_BASE_URL}/models/all${queryString ? `?${queryString}` : ''}`;

  return fetchWithRetry<ZeroEvalModelBasic[]>(url);
}

/**
 * Get all models with full benchmark scores
 */
export async function getModelsFull(): Promise<ZeroEvalModelFull[]> {
  return fetchWithRetry<ZeroEvalModelFull[]>(`${ZEROEVAL_BASE_URL}/models/full`);
}

/**
 * Get detailed information for a specific model
 */
export async function getModelDetail(modelId: string): Promise<ZeroEvalModelDetail> {
  return fetchWithRetry<ZeroEvalModelDetail>(
    `${ZEROEVAL_BASE_URL}/models/${encodeURIComponent(modelId)}`,
  );
}

/**
 * Get all benchmarks
 */
export async function getBenchmarks(): Promise<ZeroEvalBenchmark[]> {
  return fetchWithRetry<ZeroEvalBenchmark[]>(`${ZEROEVAL_BASE_URL}/benchmarks`);
}

/**
 * Get arena scores for multiple models
 * @param modelIds - Array of model IDs to fetch arena scores for
 */
export async function getArenaScores(modelIds: string[]): Promise<ArenaScoresResponse> {
  if (modelIds.length === 0) {
    return {};
  }

  const params = new URLSearchParams();
  params.set('model_ids', modelIds.join(','));
  params.set('arena_names', ALL_ARENA_NAMES.join(','));

  return fetchWithRetry<ArenaScoresResponse>(`${ZEROEVAL_BASE_URL}/arena-scores?${params}`);
}

/**
 * Get arena scores for multiple models by category
 * @param modelIds - Array of model IDs to fetch arena scores for
 * @param category - The leaderboard category to get arena scores for
 */
export async function getArenaScoresForCategory(
  modelIds: string[],
  category: LeaderboardCategory,
): Promise<ArenaScoresResponse> {
  if (modelIds.length === 0) {
    return {};
  }

  const arenaNames = CATEGORY_ARENA_NAMES[category];

  const params = new URLSearchParams();
  params.set('model_ids', modelIds.join(','));
  params.set('arena_names', arenaNames.join(','));

  return fetchWithRetry<ArenaScoresResponse>(`${ZEROEVAL_BASE_URL}/arena-scores?${params}`);
}

// ============================================================================
// Arena Score Calculation Functions
// ============================================================================

/**
 * Calculate Code Arena score (display value)
 * Code Arena = average of 6 code-related arena scores × 100
 */
export function calculateCodeArenaScore(arenaScores: ArenaScores): number | null {
  const scores = CODE_ARENA_KEYS.map((key) => arenaScores[key]).filter(
    (s): s is number => s !== undefined && s !== null,
  );

  if (scores.length === 0) return null;

  const average = scores.reduce((a, b) => a + b, 0) / scores.length;
  // Keep 2 decimal places for display
  return Math.round(average * 100 * 100) / 100;
}

/**
 * Calculate Chat Arena score (display value, × 100)
 * Chat Arena = chat-arena raw score × 100
 */
export function calculateChatArenaScore(arenaScores: ArenaScores): number | null {
  const score = arenaScores['chat-arena'];
  // Keep 2 decimal places for display
  return score != null ? Math.round(score * 100 * 100) / 100 : null;
}

/**
 * Convert arena scores to display values (× 100) for non-LLM categories
 * @param arenaScores - Raw arena scores from API
 * @param category - The leaderboard category
 * @returns Object with converted arena scores
 */
export function calculateCategoryArenaScores(
  arenaScores: ArenaScores,
  category: LeaderboardCategory,
): Partial<ArenaScores> {
  const arenaKeys = CATEGORY_ARENA_NAMES[category];
  const result: Partial<ArenaScores> = {};

  for (const key of arenaKeys) {
    const rawScore = arenaScores[key as keyof ArenaScores];
    if (rawScore != null) {
      // Convert to display value: × 100, keep 2 decimal places
      result[key as keyof ArenaScores] = Math.round(rawScore * 100 * 100) / 100;
    }
  }

  return result;
}

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

/**
 * Get organization color for charts based on organization_id
 */
export function getOrganizationColor(organizationId: string): string {
  const colors: Record<string, string> = {
    openai: '#10A37F',
    anthropic: '#D4A574',
    google: '#4285F4',
    meta: '#0668E1',
    mistral: '#FF7000',
    deepseek: '#536DFE',
    'zai-org': '#000000', // Zhipu AI
    zhipu: '#000000',
    minimax: '#7C3AED',
    xiaomi: '#FF6900',
    nvidia: '#76B900',
    cohere: '#D14500',
    xai: '#000000',
    'black-forest-labs': '#000000',
    bytedance: '#00F5D4',
    luma: '#6366F1',
    elevenlabs: '#000000',
    amazon: '#FF9900', // Amazon/AWS orange
    aws: '#FF9900',
    moonshot: '#6366F1', // Moonshot/Kimi
    'moonshot-ai': '#6366F1',
    kimi: '#6366F1',
    tencent: '#00A4FF', // Tencent blue
    hunyuan: '#00A4FF',
    'recraft-ai': '#8B5CF6',
    qwen: '#6366F1', // Alibaba Qwen
  };

  return colors[organizationId.toLowerCase()] || '#6B7280';
}
