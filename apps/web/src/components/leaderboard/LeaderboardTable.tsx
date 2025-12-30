'use client';

import { Badge, cn, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@lmring/ui';
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  LockIcon,
  UnlockIcon,
  XIcon,
} from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { ProviderIcon } from '@/components/arena/provider-icon';
import { type ArenaScores, formatMetricValue, type MetricConfig } from '@/libs/zeroeval-api';
import type { LeaderboardModel, SortConfig } from './types';

// Default column widths in pixels
const DEFAULT_COLUMN_WIDTHS: Record<string, number> = {
  rank: 60,
  model: 220,
  knowledge_cutoff: 130,
  multimodal: 100,
  license: 110,
};

// Default width for metric columns
const DEFAULT_METRIC_WIDTH = 95;

// Minimum column width
const MIN_COLUMN_WIDTH = 50;

interface LeaderboardTableProps {
  models: LeaderboardModel[];
  metrics: MetricConfig[];
  sortConfig: SortConfig;
  onSort: (field: string) => void;
  page: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
}

function ResizeHandle({
  columnId,
  onResize,
}: {
  columnId: string;
  onResize: (columnId: string, delta: number) => void;
}) {
  const startX = useRef(0);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      startX.current = e.clientX;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const delta = moveEvent.clientX - startX.current;
        startX.current = moveEvent.clientX;
        onResize(columnId, delta);
      };

      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    },
    [columnId, onResize],
  );

  return (
    <div
      role="slider"
      aria-valuenow={0}
      tabIndex={-1}
      className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/50 group-hover:bg-border"
      onMouseDown={handleMouseDown}
    />
  );
}

function SortIndicator({ field, sortConfig }: { field: string; sortConfig: SortConfig }) {
  if (sortConfig.field !== field) {
    return <span className="w-4" />;
  }
  return sortConfig.direction === 'desc' ? (
    <ChevronDownIcon className="h-4 w-4" />
  ) : (
    <ChevronUpIcon className="h-4 w-4" />
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-yellow-500 text-white text-[10px] font-bold">
        {rank}
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-400 text-white text-[10px] font-bold">
        {rank}
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-600 text-white text-[10px] font-bold">
        {rank}
      </span>
    );
  }
  return <span className="text-muted-foreground font-medium text-xs">{rank}</span>;
}

function LicenseBadge({ license }: { license: string }) {
  const isOpen = license !== 'proprietary' && !license.includes('proprietary');
  const displayLicense = license.length > 15 ? `${license.slice(0, 12)}...` : license;

  return (
    <div className="flex items-center gap-1.5 justify-center" title={license}>
      {isOpen ? (
        <UnlockIcon className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
      ) : (
        <LockIcon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
      )}
      <span className="text-xs text-muted-foreground truncate max-w-[80px]">{displayLicense}</span>
    </div>
  );
}

function MultimodalBadge({ supported }: { supported: boolean }) {
  return supported ? (
    <CheckIcon className="h-4 w-4 text-green-500 mx-auto" />
  ) : (
    <XIcon className="h-4 w-4 text-muted-foreground mx-auto" />
  );
}

function ScoreCell({
  value,
  format,
  highlight,
}: {
  value: string | number | null;
  format: MetricConfig['format'];
  highlight?: boolean;
}) {
  const formatted = formatMetricValue(value, format);
  const isHighScore = format === 'percentage' && typeof value === 'number' && value >= 0.8;

  return (
    <span
      className={cn(
        'tabular-nums text-xs',
        isHighScore && highlight && 'text-green-600 dark:text-green-400 font-semibold',
      )}
    >
      {formatted}
    </span>
  );
}

// Code Arena sub-score labels for display
const CODE_ARENA_LABELS: Record<string, string> = {
  'text-to-website': 'Text → Website',
  threejs: 'ThreeJS',
  'text-to-game': 'Text → Game',
  'p5-animation': 'P5 Animation',
  'text-to-svg': 'Text → SVG',
  dataviz: 'DataViz',
};

function ArenaScoreCell({
  value,
  arenaType,
  rawScores,
}: {
  value: number | null;
  arenaType: 'code_arena' | 'chat_arena';
  rawScores?: ArenaScores | null;
}) {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground">—</span>;
  }

  const isPositive = value >= 0;

  const tooltipContent = () => {
    if (!rawScores) return null;

    if (arenaType === 'chat_arena') {
      const chatScore = rawScores['chat-arena'];
      return (
        <div className="space-y-2 min-w-[200px]">
          <div className="font-medium border-b border-border pb-1">Chat Arena</div>
          <div className="text-xs text-muted-foreground">Raw score × 100 = Display score</div>
          {chatScore !== undefined && (
            <div className="flex justify-between text-sm">
              <span>chat-arena:</span>
              <span className="tabular-nums">
                {chatScore.toFixed(2)} × 100 = {Math.round(chatScore * 100)}
              </span>
            </div>
          )}
        </div>
      );
    }

    // Code Arena
    const codeArenaKeys = Object.keys(CODE_ARENA_LABELS) as (keyof ArenaScores)[];
    const scores = codeArenaKeys
      .map((key) => ({ key, value: rawScores[key] }))
      .filter((s) => s.value !== undefined && s.value !== null);

    const average =
      scores.length > 0 ? scores.reduce((sum, s) => sum + (s.value || 0), 0) / scores.length : 0;

    return (
      <div className="space-y-2 min-w-[280px]">
        <div className="font-medium border-b border-border pb-1">Code Arena Breakdown</div>
        <div className="text-xs text-muted-foreground">
          Average of {scores.length} sub-scores × 100
        </div>
        <div className="space-y-1">
          {codeArenaKeys.map((key) => {
            const score = rawScores[key];
            if (score === undefined || score === null) return null;
            return (
              <div key={key} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{CODE_ARENA_LABELS[key]}:</span>
                <span
                  className={cn('tabular-nums', score >= 0 ? 'text-green-600' : 'text-red-500')}
                >
                  {score.toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>
        <div className="border-t border-border pt-1 flex justify-between text-sm font-medium">
          <span>Average:</span>
          <span className="tabular-nums">
            {average.toFixed(2)} × 100 = {Math.round(average * 100)}
          </span>
        </div>
      </div>
    );
  };

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              'tabular-nums text-xs cursor-help underline decoration-dotted underline-offset-2',
              isPositive ? 'text-foreground' : 'text-red-500',
            )}
          >
            {value.toLocaleString()}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="p-3">
          {tooltipContent()}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function LeaderboardTable({
  models,
  metrics,
  sortConfig,
  onSort,
  page,
  pageSize,
  totalCount,
  onPageChange,
}: LeaderboardTableProps) {
  const totalPages = Math.ceil(totalCount / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalCount);

  const initialWidths = useMemo(() => {
    const widths: Record<string, number> = { ...DEFAULT_COLUMN_WIDTHS };
    for (const metric of metrics) {
      widths[metric.id] = DEFAULT_METRIC_WIDTH;
    }
    return widths;
  }, [metrics]);

  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(initialWidths);

  const handleResize = useCallback((columnId: string, delta: number) => {
    setColumnWidths((prev) => {
      const currentWidth = prev[columnId] || DEFAULT_METRIC_WIDTH;
      const newWidth = Math.max(MIN_COLUMN_WIDTH, currentWidth + delta);
      return { ...prev, [columnId]: newWidth };
    });
  }, []);

  const getWidth = useCallback(
    (columnId: string) => {
      return columnWidths[columnId] || DEFAULT_METRIC_WIDTH;
    },
    [columnWidths],
  );

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full table-fixed">
          <thead>
            <tr className="border-b border-border">
              <th
                className="group relative px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                style={{ width: getWidth('rank') }}
              >
                Rank
                <ResizeHandle columnId="rank" onResize={handleResize} />
              </th>
              <th
                className="group relative px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                style={{ width: getWidth('model') }}
              >
                Model
                <ResizeHandle columnId="model" onResize={handleResize} />
              </th>
              {metrics.map((metric) => (
                <th
                  key={metric.id}
                  className="group relative px-3 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors whitespace-nowrap"
                  style={{ width: getWidth(metric.id) }}
                  onClick={() => onSort(metric.field)}
                >
                  <div className="flex items-center justify-end gap-1">
                    {metric.label}
                    <SortIndicator field={metric.field} sortConfig={sortConfig} />
                  </div>
                  <ResizeHandle columnId={metric.id} onResize={handleResize} />
                </th>
              ))}
              <th
                className="group relative px-3 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap"
                style={{ width: getWidth('knowledge_cutoff') }}
              >
                Knowledge Cutoff
                <ResizeHandle columnId="knowledge_cutoff" onResize={handleResize} />
              </th>
              <th
                className="group relative px-3 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider"
                style={{ width: getWidth('multimodal') }}
              >
                Multimodal
                <ResizeHandle columnId="multimodal" onResize={handleResize} />
              </th>
              <th
                className="group relative px-3 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider"
                style={{ width: getWidth('license') }}
              >
                License
                <ResizeHandle columnId="license" onResize={handleResize} />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {models.map((model) => (
              <tr key={model.model_id} className="hover:bg-muted/50 transition-colors">
                <td className="px-3 py-3 whitespace-nowrap">
                  <RankBadge rank={model.rank} />
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <ProviderIcon providerId={model.organization_id} size={20} type="avatar" />
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-foreground text-sm truncate">
                          {model.name}
                        </span>
                        {model.isNew && (
                          <Badge
                            variant="default"
                            className="text-[9px] px-1 py-0 bg-green-500 hover:bg-green-500 flex-shrink-0"
                          >
                            NEW
                          </Badge>
                        )}
                      </div>
                      <span className="text-[11px] text-muted-foreground truncate">
                        {model.organization}
                      </span>
                    </div>
                  </div>
                </td>
                {metrics.map((metric) => {
                  const value = model[metric.field as keyof typeof model] as string | number | null;

                  // Use special ArenaScoreCell for arena metrics
                  if (metric.field === 'code_arena_score' || metric.field === 'chat_arena_score') {
                    return (
                      <td
                        key={metric.id}
                        className="px-3 py-3 text-right whitespace-nowrap text-sm"
                      >
                        <ArenaScoreCell
                          value={value as number | null}
                          arenaType={metric.field as 'code_arena' | 'chat_arena'}
                          rawScores={model.arena_raw_scores}
                        />
                      </td>
                    );
                  }

                  return (
                    <td key={metric.id} className="px-3 py-3 text-right whitespace-nowrap text-sm">
                      <ScoreCell
                        value={value}
                        format={metric.format}
                        highlight={metric.higherIsBetter}
                      />
                    </td>
                  );
                })}
                <td className="px-3 py-3 text-center whitespace-nowrap">
                  <span className="text-xs text-muted-foreground">
                    {model.knowledge_cutoff || '—'}
                  </span>
                </td>
                <td className="px-3 py-3 text-center">
                  <MultimodalBadge supported={model.multimodal} />
                </td>
                <td className="px-3 py-3 text-center">
                  <LicenseBadge license={model.license} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-muted-foreground">
          {startIndex + 1}-{endIndex} of {totalCount}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="px-3 py-1 text-sm rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum: number;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (page <= 3) {
              pageNum = i + 1;
            } else if (page >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = page - 2 + i;
            }
            return (
              <button
                type="button"
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={cn(
                  'w-8 h-8 text-sm rounded-md',
                  page === pageNum ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
                )}
              >
                {pageNum}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="px-3 py-1 text-sm rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
