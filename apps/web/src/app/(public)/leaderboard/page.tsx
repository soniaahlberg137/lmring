'use client';

import { Card, CardContent, Collapsible, CollapsibleContent, CollapsibleTrigger } from '@lmring/ui';
import type { SortingState } from '@tanstack/react-table';
import { ChevronDown } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import {
  type AgentDomainFilter,
  CategoryTabs,
  createBaseColumns,
  createLegalColumns,
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
import { useLeaderboardData, useLegalLeaderboardQuery } from '@/hooks/use-leaderboard-query';
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

// Tessera: axis metrics for the legal assembled-agent perf-vs-cost view.
const LEGAL_F1_METRIC: MetricConfig = {
  id: 'f1',
  label: 'F1',
  field: 'f1',
  format: 'percentage',
  higherIsBetter: true,
};
const LEGAL_COST_METRIC: MetricConfig = {
  id: 'cost_usd',
  label: 'Cost ($)',
  field: 'cost_usd',
  format: 'currency',
  higherIsBetter: false,
};
const LEGAL_LATENCY_METRIC: MetricConfig = {
  id: 'latency_ms',
  label: 'Latency (ms)',
  field: 'latency_ms',
  format: 'number',
  higherIsBetter: false,
};

export default function LeaderboardPage() {
  const t = useTranslations();

  const [category, setCategory] = useState<LeaderboardCategory>('all');
  const [domain, setDomain] = useState<AgentDomainFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [selectedMetric, setSelectedMetric] = useState<string>('gpqa');
  const [xAxisMetric, setXAxisMetric] = useState<string>('input_price');
  const [yAxisMetric, setYAxisMetric] = useState<string>('gpqa');
  const [methodologyOpen, setMethodologyOpen] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);

  // Fetch data using TanStack Query
  const { data: rawModels, isPending, error, isInitialLoading } = useLeaderboardData(category);

  // Tessera: legal assembled-agent (harness × model) matrix, fixture-backed via the API.
  const isLegal = domain === 'legal';
  const {
    data: legalRows,
    isPending: legalIsPending,
    error: legalError,
  } = useLegalLeaderboardQuery(isLegal);

  const categoryConfig = useMemo(() => {
    const config = CATEGORY_CONFIGS.find((c) => c.id === category);
    const fallback = CATEGORY_CONFIGS[0];
    if (config) return config;
    if (fallback) return fallback;
    // This should never happen as CATEGORY_CONFIGS is a non-empty constant array
    throw new Error('No category config available');
  }, [category]);

  // Memoize columns for performance
  const columns = useMemo(
    () => [
      ...createBaseColumns(t),
      ...createMetricColumns(categoryConfig.metrics, t),
      ...createTrailingColumns(t),
    ],
    [categoryConfig.metrics, t],
  );

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

  // Tessera: legal leaderboard derived state (ranked by F1).
  const legalColumns = useMemo(() => createLegalColumns(t), [t]);

  const legalRanked = useMemo(
    () => (legalRows ? sortAndRankModels(legalRows, 'f1', 'desc') : []),
    [legalRows],
  );

  // Fall back to latency on the x-axis when every cell has zero/absent cost (local models).
  const legalUsesLatency = useMemo(
    () => !!legalRows?.length && legalRows.every((r) => !r.costUsd),
    [legalRows],
  );

  const legalScatterModels: LeaderboardModel[] = useMemo(
    () =>
      legalRanked.map((r) => ({
        model_id: r.runId,
        name: `${r.agentName} · ${r.baseModel}`,
        organization: r.organization ?? '',
        organization_id: (r.organization ?? '').toLowerCase().replace(/\s+/g, '-'),
        release_date: null,
        announcement_date: r.createdAt,
        multimodal: false,
        license: '',
        rank: r.rank,
        isNew: false,
        agent_name: r.agentName,
        f1: r.f1,
        cost_usd: r.costUsd,
        latency_ms: r.latencyMs,
      })),
    [legalRanked],
  );

  const legalXMetric = legalUsesLatency ? LEGAL_LATENCY_METRIC : LEGAL_COST_METRIC;
  // Legal has no bar view; fall back to the table when 'bar' is selected.
  const legalViewMode = viewMode === 'bar' ? 'table' : viewMode;

  const handleCategoryChange = useCallback((newCategory: LeaderboardCategory) => {
    setCategory(newCategory);
    setSorting([]);
    const config = CATEGORY_CONFIGS.find((c) => c.id === newCategory);
    if (config && config.metrics.length > 0) {
      const firstMetric = config.metrics[0];
      if (firstMetric) {
        setSelectedMetric(firstMetric.id);
      }
      if (config.metrics.length >= 2) {
        const firstM = config.metrics[0];
        const secondLastM = config.metrics[config.metrics.length - 2];
        if (firstM) setYAxisMetric(firstM.id);
        if (secondLastM) setXAxisMetric(secondLastM.id);
      }
    }
  }, []);

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

  if (!isLegal && isInitialLoading) {
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

  if (!isLegal && error) {
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
            {/* Toolbar - category + view controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
              <CategoryTabs activeCategory={category} onCategoryChange={handleCategoryChange} />

              <div className="flex items-center gap-2">
                {!isLegal && viewMode === 'bar' && (
                  <MetricSelector
                    metrics={categoryConfig.metrics}
                    selectedMetric={selectedMetric}
                    onMetricChange={setSelectedMetric}
                    label={t('Leaderboard.metric_label')}
                  />
                )}

                {!isLegal && viewMode === 'scatter' && (
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

                <div className="w-px h-6 bg-border/50 mx-1" />
                <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
              </div>
            </div>

            {/* Domain filter */}
            <div className="mb-4">
              <DomainTabs activeDomain={domain} onDomainChange={setDomain} />
            </div>

            {/* Subheader */}
            <div className="flex items-center mb-4">
              <span className="text-xs tabular-nums text-muted-foreground/60 tracking-tight">
                {isLegal
                  ? legalIsPending
                    ? '—'
                    : t('Leaderboard.models_count', { count: legalRanked.length })
                  : isPending
                    ? '—'
                    : t('Leaderboard.models_count', { count: rankedModels.length })}
              </span>
            </div>

            <div className="min-h-[500px]">
              {isLegal ? (
                legalIsPending ? (
                  <LeaderboardContentSkeleton rows={PAGE_SIZE} metricColumns={5} />
                ) : legalError ? (
                  <div className="flex items-center justify-center h-[400px] text-destructive">
                    {legalError.message}
                  </div>
                ) : (
                  <>
                    {legalViewMode === 'table' && (
                      <DataTable columns={legalColumns} data={legalRanked} pageSize={PAGE_SIZE} />
                    )}

                    {legalViewMode === 'scatter' && (
                      <LazyLeaderboardScatterPlot
                        models={legalScatterModels}
                        xMetric={legalXMetric}
                        yMetric={LEGAL_F1_METRIC}
                        showFrontier
                      />
                    )}
                  </>
                )
              ) : isPending ? (
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
                {/* Infrastructure Section */}
                <section>
                  <h3 className="text-base font-semibold mb-2">
                    {t('Leaderboard.methodology_infrastructure_title')}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t('Leaderboard.methodology_infrastructure_description')}
                  </p>
                </section>

                {/* Ranking System Section */}
                <section>
                  <h3 className="text-base font-semibold mb-2">
                    {t('Leaderboard.methodology_ranking_title')}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    {t('Leaderboard.methodology_ranking_description')}
                  </p>

                  {/* Initial State */}
                  <div className="ml-4 mb-3">
                    <h4 className="text-sm font-medium mb-1">
                      {t('Leaderboard.methodology_ranking_initial_state_title')}
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {t('Leaderboard.methodology_ranking_initial_state_description')}
                    </p>
                  </div>

                  {/* Rating Updates */}
                  <div className="ml-4 mb-3">
                    <h4 className="text-sm font-medium mb-1">
                      {t('Leaderboard.methodology_ranking_rating_updates_title')}
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {t('Leaderboard.methodology_ranking_rating_updates_description')}
                    </p>
                  </div>

                  {/* Leaderboard Ranking */}
                  <div className="ml-4">
                    <h4 className="text-sm font-medium mb-1">
                      {t('Leaderboard.methodology_ranking_leaderboard_ranking_title')}
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {t('Leaderboard.methodology_ranking_leaderboard_ranking_description')}
                    </p>
                  </div>
                </section>

                {/* Parameters Section */}
                <section>
                  <h3 className="text-base font-semibold mb-3">
                    {t('Leaderboard.methodology_parameters_title')}
                  </h3>
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* mu */}
                    <div className="flex flex-col">
                      <dt className="text-sm font-medium mb-1">
                        {t('Leaderboard.methodology_parameters_mu_label')}
                      </dt>
                      <dd className="text-sm text-muted-foreground">
                        {t('Leaderboard.methodology_parameters_mu_description')}
                      </dd>
                      <dd className="text-xs text-muted-foreground mt-1">
                        Default: {t('Leaderboard.methodology_parameters_mu_default')}
                      </dd>
                    </div>

                    {/* sigma */}
                    <div className="flex flex-col">
                      <dt className="text-sm font-medium mb-1">
                        {t('Leaderboard.methodology_parameters_sigma_label')}
                      </dt>
                      <dd className="text-sm text-muted-foreground">
                        {t('Leaderboard.methodology_parameters_sigma_description')}
                      </dd>
                      <dd className="text-xs text-muted-foreground mt-1">
                        Default: {t('Leaderboard.methodology_parameters_sigma_default')}
                      </dd>
                    </div>

                    {/* beta */}
                    <div className="flex flex-col">
                      <dt className="text-sm font-medium mb-1">
                        {t('Leaderboard.methodology_parameters_beta_label')}
                      </dt>
                      <dd className="text-sm text-muted-foreground">
                        {t('Leaderboard.methodology_parameters_beta_description')}
                      </dd>
                      <dd className="text-xs text-muted-foreground mt-1">
                        Default: {t('Leaderboard.methodology_parameters_beta_default')}
                      </dd>
                    </div>

                    {/* tau */}
                    <div className="flex flex-col">
                      <dt className="text-sm font-medium mb-1">
                        {t('Leaderboard.methodology_parameters_tau_label')}
                      </dt>
                      <dd className="text-sm text-muted-foreground">
                        {t('Leaderboard.methodology_parameters_tau_description')}
                      </dd>
                      <dd className="text-xs text-muted-foreground mt-1">
                        Default: {t('Leaderboard.methodology_parameters_tau_default')}
                      </dd>
                    </div>
                  </dl>
                </section>
              </CollapsibleContent>
            </Collapsible>

            <div className="mt-6 pt-4 border-t border-border text-center">
              <p className="text-xs text-muted-foreground">
                {t('Leaderboard.data_source')}{' '}
                <a
                  href="https://github.com/WildEval/ZeroEval"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  ZeroEval
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
