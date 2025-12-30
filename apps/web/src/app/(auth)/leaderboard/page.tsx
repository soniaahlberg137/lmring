'use client';

import { Card, CardContent } from '@lmring/ui';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CategoryTabs,
  LeaderboardBarChart,
  LeaderboardContentSkeleton,
  type LeaderboardModel,
  LeaderboardScatterPlot,
  LeaderboardTable,
  LeaderboardTableSkeleton,
  MetricSelector,
  type SortConfig,
  type ViewMode,
  ViewToggle,
} from '@/components/leaderboard';
import {
  CATEGORY_CONFIGS,
  calculateCategoryArenaScores,
  calculateChatArenaScore,
  calculateCodeArenaScore,
  getArenaScores,
  getArenaScoresForCategory,
  getModelsAll,
  getModelsFull,
  isNewModel,
  type LeaderboardCategory,
  type MetricConfig,
  type ModelsAllParams,
  sortModels,
} from '@/libs/zeroeval-api';
import { type ModelWithArena, useLeaderboardStore } from '@/stores';

const PAGE_SIZE = 20;

export default function LeaderboardPage() {
  const t = useTranslations('Leaderboard');

  // Zustand store for caching data by category
  const getCachedData = useLeaderboardStore((state) => state.getCachedData);
  const setCachedData = useLeaderboardStore((state) => state.setCachedData);
  const getLastUpdated = useLeaderboardStore((state) => state.getLastUpdated);

  const [rawModels, setRawModels] = useState<ModelWithArena[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<LeaderboardCategory>('llm');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'gpqa_score',
    direction: 'desc',
  });
  const [selectedMetric, setSelectedMetric] = useState<string>('gpqa');
  const [xAxisMetric, setXAxisMetric] = useState<string>('input_price');
  const [yAxisMetric, setYAxisMetric] = useState<string>('gpqa');
  const [page, setPage] = useState(1);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const categoryConfig = useMemo(() => {
    const config = CATEGORY_CONFIGS.find((c) => c.id === category);
    const fallback = CATEGORY_CONFIGS[0];
    if (config) return config;
    if (fallback) return fallback;
    // This should never happen as CATEGORY_CONFIGS is a non-empty constant array
    throw new Error('No category config available');
  }, [category]);

  const fetchData = useCallback(
    async (currentCategory: LeaderboardCategory) => {
      // Check cache first
      const cachedData = getCachedData(currentCategory);
      if (cachedData) {
        setRawModels(cachedData);
        setLastUpdated(getLastUpdated(currentCategory));
        setLoading(false);
        setIsInitialLoad(false);
        return;
      }

      // No cache - fetch from API
      setLoading(true);
      setError(null);
      try {
        const config = CATEGORY_CONFIGS.find((c) => c.id === currentCategory);

        let fetchedModels: ModelWithArena[];

        if (currentCategory === 'llm' || currentCategory === 'vision') {
          const models = await getModelsFull();
          const modelIds = models.map((m) => m.model_id);
          let arenaData: Awaited<ReturnType<typeof getArenaScores>> = {};
          try {
            arenaData = await getArenaScores(modelIds);
          } catch {
            console.warn('Failed to fetch arena scores, continuing without them');
          }

          fetchedModels = models.map((model) => {
            const arenaScores = arenaData[model.model_id];
            return {
              ...model,
              code_arena_score: arenaScores ? calculateCodeArenaScore(arenaScores) : null,
              chat_arena_score: arenaScores ? calculateChatArenaScore(arenaScores) : null,
              arena_raw_scores: arenaScores || null,
            };
          });
        } else {
          const apiParams: ModelsAllParams = config?.apiParams || {};
          const basicModels = await getModelsAll(apiParams);
          const modelIds = basicModels.map((m) => m.model_id);

          let arenaData: Awaited<ReturnType<typeof getArenaScoresForCategory>> = {};
          try {
            arenaData = await getArenaScoresForCategory(modelIds, currentCategory);
          } catch {
            console.warn('Failed to fetch arena scores, continuing without them');
          }

          fetchedModels = basicModels.map((model) => {
            const arenaScores = arenaData[model.model_id];
            const convertedScores = arenaScores
              ? calculateCategoryArenaScores(arenaScores, currentCategory)
              : {};
            return {
              ...model,
              arena_raw_scores: arenaScores || null,
              // Flatten converted arena scores to top level for sorting/display
              ...convertedScores,
            };
          });
        }

        // Store in cache and update state
        setCachedData(currentCategory, fetchedModels);
        setRawModels(fetchedModels);
        setLastUpdated(new Date());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
        setIsInitialLoad(false);
      }
    },
    [getCachedData, setCachedData, getLastUpdated],
  );

  useEffect(() => {
    fetchData(category);
  }, [fetchData, category]);

  const filteredModels = rawModels;

  const rankedModels: LeaderboardModel[] = useMemo(() => {
    const sorted = sortModels(filteredModels, sortConfig.field, sortConfig.direction);
    return sorted.map((model, index) => ({
      ...model,
      rank: index + 1,
      isNew: isNewModel(model.release_date, model.announcement_date),
    })) as LeaderboardModel[];
  }, [filteredModels, sortConfig]);

  const paginatedModels = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return rankedModels.slice(start, start + PAGE_SIZE);
  }, [rankedModels, page]);

  const barChartModels = useMemo(() => {
    const metricConfig = categoryConfig.metrics.find((m) => m.id === selectedMetric);
    const field = metricConfig?.field || categoryConfig.metrics[0]?.field || 'gpqa_score';
    const sorted = sortModels(filteredModels, field, 'desc');
    return sorted.slice(0, PAGE_SIZE).map((model, index) => ({
      ...model,
      rank: index + 1,
      isNew: isNewModel(model.release_date, model.announcement_date),
    })) as LeaderboardModel[];
  }, [filteredModels, selectedMetric, categoryConfig.metrics]);

  const scatterPlotModels = useMemo(() => {
    const metricConfig = categoryConfig.metrics.find((m) => m.id === yAxisMetric);
    const field = metricConfig?.field || categoryConfig.metrics[0]?.field || 'gpqa_score';
    const sorted = sortModels(filteredModels, field, 'desc');
    return sorted.slice(0, PAGE_SIZE).map((model, index) => ({
      ...model,
      rank: index + 1,
      isNew: isNewModel(model.release_date, model.announcement_date),
    })) as LeaderboardModel[];
  }, [filteredModels, yAxisMetric, categoryConfig.metrics]);

  const handleSort = useCallback((field: string) => {
    setSortConfig((prev) => ({
      field,
      direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
    setPage(1);
  }, []);

  const handleCategoryChange = useCallback((newCategory: LeaderboardCategory) => {
    setCategory(newCategory);
    setPage(1);
    const config = CATEGORY_CONFIGS.find((c) => c.id === newCategory);
    if (config && config.metrics.length > 0) {
      const firstMetric = config.metrics[0];
      if (firstMetric) {
        setSortConfig({ field: firstMetric.field, direction: 'desc' });
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

  if (loading && isInitialLoad) {
    return <LeaderboardTableSkeleton rows={PAGE_SIZE} metricColumns={7} />;
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div className="mb-6">
          <h1 className="text-2xl font-medium text-foreground">{t('title')}</h1>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-[400px] gap-4">
            <p className="text-destructive">{error}</p>
            <button
              type="button"
              onClick={() => fetchData(category)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Retry
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-medium text-foreground">AI Leaderboards</h1>
            <p className="text-sm text-muted-foreground">Top models ranked by performance.</p>
          </div>
          {lastUpdated && (
            <span className="text-xs text-muted-foreground">
              Updated {lastUpdated.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <CategoryTabs activeCategory={category} onCategoryChange={handleCategoryChange} />

              <div className="flex items-center gap-3">
                {viewMode === 'bar' && (
                  <MetricSelector
                    metrics={categoryConfig.metrics}
                    selectedMetric={selectedMetric}
                    onMetricChange={setSelectedMetric}
                    label="Metric"
                    inline
                  />
                )}

                {viewMode === 'scatter' && (
                  <>
                    <MetricSelector
                      metrics={categoryConfig.metrics}
                      selectedMetric={xAxisMetric}
                      onMetricChange={setXAxisMetric}
                      label="X Axis"
                      inline
                    />
                    <MetricSelector
                      metrics={categoryConfig.metrics}
                      selectedMetric={yAxisMetric}
                      onMetricChange={setYAxisMetric}
                      label="Y Axis"
                      inline
                    />
                  </>
                )}

                <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-muted-foreground">
                {loading ? '—' : `${rankedModels.length} MODELS`}
              </div>
            </div>

            <div className="min-h-[500px]">
              {loading ? (
                <LeaderboardContentSkeleton
                  rows={PAGE_SIZE}
                  metricColumns={categoryConfig.metrics.length}
                />
              ) : (
                <>
                  {viewMode === 'table' && (
                    <LeaderboardTable
                      models={paginatedModels}
                      metrics={categoryConfig.metrics}
                      sortConfig={sortConfig}
                      onSort={handleSort}
                      page={page}
                      pageSize={PAGE_SIZE}
                      totalCount={rankedModels.length}
                      onPageChange={setPage}
                    />
                  )}

                  {viewMode === 'bar' && (
                    <LeaderboardBarChart
                      models={barChartModels}
                      metric={getMetricConfig(selectedMetric)}
                      maxItems={PAGE_SIZE}
                    />
                  )}

                  {viewMode === 'scatter' && (
                    <LeaderboardScatterPlot
                      models={scatterPlotModels}
                      xMetric={getMetricConfig(xAxisMetric)}
                      yMetric={getMetricConfig(yAxisMetric)}
                    />
                  )}
                </>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-border text-center">
              <p className="text-xs text-muted-foreground">
                Data sourced from{' '}
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
      </motion.div>
    </div>
  );
}
