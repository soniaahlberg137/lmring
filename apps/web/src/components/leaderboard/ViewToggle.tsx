'use client';

import { cn } from '@lmring/ui';
import { BarChart3Icon, ScatterChartIcon, TableIcon } from 'lucide-react';
import { useTranslations } from '@/hooks/use-translations';
import type { ViewMode } from './types';

interface ViewToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

const VIEW_OPTIONS = [
  { mode: 'table', icon: TableIcon, labelKey: 'Leaderboard.view_table' },
  { mode: 'bar', icon: BarChart3Icon, labelKey: 'Leaderboard.view_bar_chart' },
  { mode: 'scatter', icon: ScatterChartIcon, labelKey: 'Leaderboard.view_scatter_plot' },
] as const;

// Preload the lazy chart chunk on hover/focus so switching views feels instant
const preloadChartModule = (mode: ViewMode) => {
  if (mode === 'bar') {
    void import('./LeaderboardBarChart');
  } else if (mode === 'scatter') {
    void import('./LeaderboardScatterPlot');
  }
};

export function ViewToggle({ viewMode, onViewModeChange }: ViewToggleProps) {
  const t = useTranslations();

  return (
    <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
      {VIEW_OPTIONS.map(({ mode, icon: Icon, labelKey }) => (
        <button
          type="button"
          key={mode}
          onClick={() => onViewModeChange(mode)}
          onMouseEnter={() => preloadChartModule(mode)}
          onFocus={() => preloadChartModule(mode)}
          className={cn(
            'p-2 rounded-md transition-all',
            viewMode === mode
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-background/50',
          )}
          title={t(labelKey)}
        >
          <Icon className="h-4 w-4 cursor-pointer" />
        </button>
      ))}
    </div>
  );
}
