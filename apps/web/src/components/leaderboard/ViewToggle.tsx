'use client';

import { cn } from '@lmring/ui';
import { BarChart3Icon, ScatterChartIcon, TableIcon } from 'lucide-react';
import type { ViewMode } from './types';

interface ViewToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

const VIEW_OPTIONS: { mode: ViewMode; icon: typeof TableIcon; label: string }[] = [
  { mode: 'table', icon: TableIcon, label: 'Table' },
  { mode: 'bar', icon: BarChart3Icon, label: 'Bar Chart' },
  { mode: 'scatter', icon: ScatterChartIcon, label: 'Scatter Plot' },
];

export function ViewToggle({ viewMode, onViewModeChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
      {VIEW_OPTIONS.map(({ mode, icon: Icon, label }) => (
        <button
          type="button"
          key={mode}
          onClick={() => onViewModeChange(mode)}
          className={cn(
            'p-2 rounded-md transition-all',
            viewMode === mode
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-background/50',
          )}
          title={label}
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}
