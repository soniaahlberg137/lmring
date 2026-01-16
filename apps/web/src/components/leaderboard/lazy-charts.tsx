'use client';

import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';
import { LeaderboardContentSkeleton } from './LeaderboardTableSkeleton';
import type { LeaderboardBarChartProps, LeaderboardScatterPlotProps } from './types';

// Lazy load chart components to reduce initial bundle size
// Recharts is ~40KB gzipped and only needed when viewMode !== 'table'
export const LazyLeaderboardBarChart: ComponentType<LeaderboardBarChartProps> = dynamic(
  () => import('./LeaderboardBarChart').then((mod) => ({ default: mod.LeaderboardBarChart })),
  {
    ssr: false,
    loading: () => <LeaderboardContentSkeleton rows={20} metricColumns={1} />,
  },
);

export const LazyLeaderboardScatterPlot: ComponentType<LeaderboardScatterPlotProps> = dynamic(
  () => import('./LeaderboardScatterPlot').then((mod) => ({ default: mod.LeaderboardScatterPlot })),
  {
    ssr: false,
    loading: () => <LeaderboardContentSkeleton rows={20} metricColumns={2} />,
  },
);
