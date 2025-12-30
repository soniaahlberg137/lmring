import type { ArenaScores, LeaderboardCategory, MetricConfig } from '@/libs/zeroeval-api';

export type ViewMode = 'table' | 'bar' | 'scatter';

export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: string;
  direction: SortDirection;
}

export interface LeaderboardState {
  category: LeaderboardCategory;
  viewMode: ViewMode;
  sortConfig: SortConfig;
  selectedMetric: string;
  xAxisMetric: string;
  yAxisMetric: string;
  page: number;
  pageSize: number;
}

// Base model type that includes common fields from both API responses
export interface LeaderboardModel {
  model_id: string;
  name: string;
  organization: string;
  organization_id: string;
  release_date: string | null;
  announcement_date: string;
  multimodal: boolean;
  license: string;
  rank: number;
  isNew: boolean;
  // Optional fields from ZeroEvalModelFull
  organization_country?: string;
  params?: number | null;
  context?: number | null;
  canonical_model_id?: string | null;
  knowledge_cutoff?: string | null;
  input_price?: string | null;
  output_price?: string | null;
  throughput?: string | null;
  latency?: string | null;
  aime_2025_score?: number | null;
  hle_score?: number | null;
  gpqa_score?: number | null;
  swe_bench_verified_score?: number | null;
  mmmu_score?: number | null;
  // Arena scores (display values, already × 100)
  chat_arena_score?: number | null;
  code_arena_score?: number | null;
  // Raw arena scores for tooltip display
  arena_raw_scores?: ArenaScores | null;
  // Optional fields from ZeroEvalModelBasic
  model_type?: 'llm' | 'image' | 'video' | 'tts' | 'stt';
  is_open?: boolean;
  input_modalities?: string[];
  output_modalities?: string[];
}

export interface LeaderboardTableProps {
  models: LeaderboardModel[];
  metrics: MetricConfig[];
  sortConfig: SortConfig;
  onSort: (field: string) => void;
  page: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
}

export interface LeaderboardBarChartProps {
  models: LeaderboardModel[];
  metric: MetricConfig;
  maxItems?: number;
}

export interface LeaderboardScatterPlotProps {
  models: LeaderboardModel[];
  xMetric: MetricConfig;
  yMetric: MetricConfig;
}

export interface CategoryTabsProps {
  activeCategory: LeaderboardCategory;
  onCategoryChange: (category: LeaderboardCategory) => void;
}

export interface MetricSelectorProps {
  metrics: MetricConfig[];
  selectedMetric: string;
  onMetricChange: (metricId: string) => void;
  label?: string;
}

export interface ViewToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}
