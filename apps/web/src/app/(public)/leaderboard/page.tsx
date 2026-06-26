'use client';

import {
  Card,
  CardContent,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  cn,
} from '@lmring/ui';
import type { SortingState } from '@tanstack/react-table';
import { ChevronDown } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import {
  type AgentDomainFilter,
  createBaseColumns,
  createMetricColumns,
  createTrailingColumns,
  DataTable,
  DomainTabs,
  LazyLeaderboardBarChart,
  LazyLeaderboardScatterPlot,
  LeaderboardContentSkeleton,
  type LeaderboardModel,
  LeaderboardTableSkeleton,
  MetricSelector,
  type ViewMode,
  ViewToggle,
} from '@/components/leaderboard';
import { useLeaderboardData } from '@/hooks/use-leaderboard-query';
import { useTranslations } from '@/hooks/use-translations';
import {
  CATEGORY_CONFIGS,
  isNewModel,
  type LeaderboardCategory,
  type MetricConfig,
  sortAndRankModels,
  sortModels,
} from '@/libs/zeroeval-api';

const PAGE_SIZE = 20;
const BENCHMARK_METRIC_IDS = new Set([
  'gaia',
  'mmlu',
  'pubmedqa',
  'gsm8k',
  'swe_bench',
  'tau_bench',
  'core_bench',
]);

function AgentDetailRow({ model }: { model: LeaderboardModel }) {
  return (
    <div className="grid gap-6 sm:grid-cols-3 text-sm">
      {model.description && (
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Description
          </p>
          <p className="text-foreground leading-relaxed">{model.description}</p>
        </div>
      )}
      {model.system_prompt && (
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            System Prompt
          </p>
          <pre className="text-xs text-foreground bg-muted rounded-md p-3 font-mono whitespace-pre-wrap leading-relaxed overflow-auto max-h-36">
            {model.system_prompt}
          </pre>
        </div>
      )}
      {model.mcp_tools && model.mcp_tools.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            MCP Tools
          </p>
          <div className="flex flex-wrap gap-1.5">
            {model.mcp_tools.map((tool) => (
              <span
                key={tool}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-muted border border-border text-muted-foreground font-mono"
              >
                {tool}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function LeaderboardPage() {
  const t = useTranslations();

  const [category] = useState<LeaderboardCategory>('all');
  const [domain, setDomain] = useState<AgentDomainFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [columnView, setColumnView] = useState<'benchmarks' | 'specs'>('benchmarks');
  const [selectedMetric, setSelectedMetric] = useState<string>('gpqa');
  const [xAxisMetric, setXAxisMetric] = useState<string>('input_price');
  const [yAxisMetric, setYAxisMetric] = useState<string>('gpqa');
  const [methodologyOpen, setMethodologyOpen] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);

  // Fetch data using TanStack Query
  const { data: rawModels, isPending, error, isInitialLoading } = useLeaderboardData(category);

  const categoryConfig = useMemo(() => {
    const config = CATEGORY_CONFIGS.find((c) => c.id === category);
    const fallback = CATEGORY_CONFIGS[0];
    if (config) return config;
    if (fallback) return fallback;
    // This should never happen as CATEGORY_CONFIGS is a non-empty constant array
    throw new Error('No category config available');
  }, [category]);

  // Memoize columns for performance
  const columns = useMemo(() => {
    if (columnView === 'benchmarks') {
      const benchmarkMetrics = categoryConfig.metrics.filter((m) => BENCHMARK_METRIC_IDS.has(m.id));
      return [...createBaseColumns(t), ...createMetricColumns(benchmarkMetrics, t)];
    }
    // specs view
    const specMetrics = categoryConfig.metrics.filter((m) => !BENCHMARK_METRIC_IDS.has(m.id));
    return [
      ...createBaseColumns(t),
      ...createMetricColumns(specMetrics, t),
      ...createTrailingColumns(t),
    ];
  }, [categoryConfig.metrics, t, columnView]);

  // Memoize ranked models with sorting handled by DataTable
  const rankedModels: LeaderboardModel[] = useMemo(() => {
    if (!rawModels) return [];
    const defaultField = categoryConfig.metrics[0]?.field || 'gpqa_score';
    const activeSort = sorting[0];
    const field = activeSort?.id || defaultField;
    const direction = activeSort?.desc ? 'desc' : 'asc';
    const sorted = activeSort
      ? sortAndRankModels(rawModels, field, direction)
      : sortAndRankModels(rawModels, defaultField, 'desc');

    return sorted.map((model) => ({
      ...model,
      isNew: isNewModel(model.release_date, model.announcement_date),
    })) as LeaderboardModel[];
  }, [rawModels, categoryConfig.metrics, sorting]);

  const barChartModels = useMemo(() => {
    if (!rawModels) return [];
    const metricConfig = categoryConfig.metrics.find((m) => m.id === selectedMetric);
    const field = metricConfig?.field || categoryConfig.metrics[0]?.field || 'gpqa_score';
    const sorted = sortModels(rawModels, field, 'desc');
    return sorted.slice(0, PAGE_SIZE).map((model, index) => ({
      ...model,
      rank: index + 1,
      isNew: isNewModel(model.release_date, model.announcement_date),
    })) as LeaderboardModel[];
  }, [rawModels, selectedMetric, categoryConfig.metrics]);

  const scatterPlotModels = useMemo(() => {
    if (!rawModels) return [];
    const metricConfig = categoryConfig.metrics.find((m) => m.id === yAxisMetric);
    const field = metricConfig?.field || categoryConfig.metrics[0]?.field || 'gpqa_score';
    const sorted = sortModels(rawModels, field, 'desc');
    return sorted.slice(0, PAGE_SIZE).map((model, index) => ({
      ...model,
      rank: index + 1,
      isNew: isNewModel(model.release_date, model.announcement_date),
    })) as LeaderboardModel[];
  }, [rawModels, yAxisMetric, categoryConfig.metrics]);

  const getMetricConfig = useCallback(
    (metricId: string): MetricConfig => {
      const found = categoryConfig.metrics.find((m) => m.id === metricId);
      if (found) return found;
      const fallback = categoryConfig.metrics[0];
      if (fallback) return fallback;
      // This should never happen as every category has metrics
      throw new Error('No metric config available');
    },
    [categoryConfig],
  );

  if (isInitialLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="mb-6">
          <h1 className="text-2xl font-medium text-foreground">{t('Leaderboard.page_title')}</h1>
          <p className="text-sm text-muted-foreground">{t('Leaderboard.page_description')}</p>
        </div>
        <LeaderboardTableSkeleton rows={PAGE_SIZE} metricColumns={7} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div className="mb-6">
          <h1 className="text-2xl font-medium text-foreground">{t('Leaderboard.page_title')}</h1>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-[400px] gap-4">
            <p className="text-destructive">{error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-medium text-foreground">{t('Leaderboard.page_title')}</h1>
            <p className="text-sm text-muted-foreground">{t('Leaderboard.page_description')}</p>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            {/* Toolbar - domain filter + view controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <DomainTabs activeDomain={domain} onDomainChange={setDomain} />

              <div className="flex items-center gap-2">
                {viewMode === 'bar' && (
                  <MetricSelector
                    metrics={categoryConfig.metrics}
                    selectedMetric={selectedMetric}
                    onMetricChange={setSelectedMetric}
                    label={t('Leaderboard.metric_label')}
                  />
                )}

                {viewMode === 'scatter' && (
                  <>
                    <MetricSelector
                      metrics={categoryConfig.metrics}
                      selectedMetric={xAxisMetric}
                      onMetricChange={setXAxisMetric}
                      label={t('Leaderboard.axis_x')}
                    />
                    <span className="text-muted-foreground/40 text-xs">{t('Leaderboard.vs')}</span>
                    <MetricSelector
                      metrics={categoryConfig.metrics}
                      selectedMetric={yAxisMetric}
                      onMetricChange={setYAxisMetric}
                      label={t('Leaderboard.axis_y')}
                    />
                  </>
                )}

                {viewMode === 'table' && (
                  <div className="flex items-center rounded-md border border-border overflow-hidden text-xs">
                    <button
                      type="button"
                      onClick={() => setColumnView('benchmarks')}
                      className={cn(
                        'px-3 py-1.5 transition-colors',
                        columnView === 'benchmarks'
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted text-muted-foreground',
                      )}
                    >
                      Benchmarks
                    </button>
                    <button
                      type="button"
                      onClick={() => setColumnView('specs')}
                      className={cn(
                        'px-3 py-1.5 transition-colors border-l border-border',
                        columnView === 'specs'
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted text-muted-foreground',
                      )}
                    >
                      Model Specs
                    </button>
                  </div>
                )}

                <div className="w-px h-6 bg-border/50 mx-1" />
                <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
              </div>
            </div>

            {/* Subheader */}
            <div className="flex items-center mb-4">
              <span className="text-xs tabular-nums text-muted-foreground/60 tracking-tight">
                {isPending ? '—' : t('Leaderboard.models_count', { count: rankedModels.length })}
              </span>
            </div>

            <div className="min-h-[500px]">
              {isPending ? (
                <LeaderboardContentSkeleton
                  rows={PAGE_SIZE}
                  metricColumns={categoryConfig.metrics.length}
                />
              ) : (
                <>
                  {viewMode === 'table' && (
                    <DataTable
                      columns={columns}
                      data={rankedModels}
                      pageSize={PAGE_SIZE}
                      sorting={sorting}
                      onSortingChange={setSorting}
                      manualSorting
                      renderExpandedRow={(model) => <AgentDetailRow model={model} />}
                    />
                  )}

                  {viewMode === 'bar' && (
                    <LazyLeaderboardBarChart
                      models={barChartModels}
                      metric={getMetricConfig(selectedMetric)}
                      maxItems={PAGE_SIZE}
                    />
                  )}

                  {viewMode === 'scatter' && (
                    <LazyLeaderboardScatterPlot
                      models={scatterPlotModels}
                      xMetric={getMetricConfig(xAxisMetric)}
                      yMetric={getMetricConfig(yAxisMetric)}
                    />
                  )}
                </>
              )}
            </div>

            {/* Methodology Section */}
            <Collapsible open={methodologyOpen} onOpenChange={setMethodologyOpen} className="mt-8">
              <CollapsibleTrigger className="flex items-center justify-between w-full py-3 px-4 text-left hover:bg-muted/50 rounded-lg transition-colors">
                <div>
                  <h2 className="text-lg font-semibold">{t('Leaderboard.methodology_title')}</h2>
                  <p className="text-sm text-muted-foreground">
                    {t('Leaderboard.methodology_subtitle')}
                  </p>
                </div>
                <ChevronDown
                  className={`h-5 w-5 text-muted-foreground transition-transform ${methodologyOpen ? 'rotate-180' : ''}`}
                />
              </CollapsibleTrigger>

              <CollapsibleContent className="px-4 py-6 space-y-6">
                {/* Infrastructure */}
                <section>
                  <h3 className="text-base font-semibold mb-2">Infrastructure</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Tessera runs benchmarks through{' '}
                    <a
                      href="https://github.com/benediktstroebl/hal-harness"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      HAL (Holistic Agent Leaderboard)
                    </a>
                    , an open-source evaluation framework. Each agent is tested by actually
                    executing it against real benchmark tasks — not self-reported scores.
                  </p>
                </section>

                {/* Benchmarks */}
                <section>
                  <h3 className="text-base font-semibold mb-3">Benchmarks</h3>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium">GAIA</dt>
                      <dd className="text-sm text-muted-foreground">
                        General knowledge and reasoning tasks, often requiring web search and
                        multi-step problem solving.
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium">SWE-bench</dt>
                      <dd className="text-sm text-muted-foreground">
                        Real-world software engineering tasks — fixing actual GitHub issues in
                        open-source repositories.
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium">tau-bench</dt>
                      <dd className="text-sm text-muted-foreground">
                        Customer service scenarios testing tool use and policy compliance across
                        realistic support interactions.
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium">CORE-bench</dt>
                      <dd className="text-sm text-muted-foreground">
                        Reproducing results from real scientific papers, testing agents on
                        computational research tasks.
                      </dd>
                    </div>
                  </dl>
                </section>

                {/* Scoring */}
                <section>
                  <h3 className="text-base font-semibold mb-2">Scoring</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Each agent is run against a benchmark&apos;s task set and scored on task success
                    rate — the percentage of tasks completed correctly. Scores are
                    benchmark-specific and not combined into a single universal rating. An agent can
                    excel at coding tasks while struggling at customer service tasks, and the
                    leaderboard reflects that honestly.
                  </p>
                </section>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
