'use client';

import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  type ArenaScores,
  formatMetricValue,
  getNumericValue,
  getOrganizationColor,
  type MetricConfig,
} from '@/libs/zeroeval-api';
import type { LeaderboardModel } from './types';

interface LeaderboardBarChartProps {
  models: LeaderboardModel[];
  metric: MetricConfig;
  maxItems?: number;
}

interface ChartDataItem {
  name: string;
  shortName: string;
  value: number;
  color: string;
  organization: string;
  modelId: string;
  arenaRawScores?: ArenaScores | null;
}

const CODE_ARENA_LABELS: Record<string, string> = {
  'text-to-website': 'Text → Website',
  threejs: 'ThreeJS',
  'text-to-game': 'Text → Game',
  'p5-animation': 'P5 Animation',
  'text-to-svg': 'Text → SVG',
  dataviz: 'DataViz',
};

export function LeaderboardBarChart({ models, metric, maxItems = 20 }: LeaderboardBarChartProps) {
  const chartData = useMemo<ChartDataItem[]>(() => {
    const filtered = models
      .filter((m) => {
        const val = m[metric.field as keyof typeof m];
        return val !== null && val !== undefined && val !== '';
      })
      .slice(0, maxItems);

    return filtered.map((model) => {
      const value = getNumericValue(
        model[metric.field as keyof typeof model] as string | number | null,
      );
      return {
        name: model.name,
        shortName: model.name.length > 12 ? `${model.name.slice(0, 10)}...` : model.name,
        value,
        color: getOrganizationColor(model.organization_id),
        organization: model.organization,
        modelId: model.model_id,
        arenaRawScores: model.arena_raw_scores,
      };
    });
  }, [models, metric, maxItems]);

  const yAxisConfig = useMemo(() => {
    if (chartData.length === 0) return { domain: [0, 1], tickFormatter: (v: number) => String(v) };

    const values = chartData.map((d) => d.value).filter((v) => v > -Infinity);
    const maxVal = Math.max(...values, 0);
    const minVal = Math.min(...values, 0);

    if (metric.format === 'percentage') {
      const upperBound = Math.min(Math.ceil(maxVal * 11) / 10, 1);
      return {
        domain: [0, upperBound],
        tickFormatter: (value: number) => `${(value * 100).toFixed(0)}%`,
      };
    }

    if (metric.format === 'currency') {
      const upperBound = Math.ceil(maxVal * 1.1);
      return {
        domain: [0, upperBound],
        tickFormatter: (value: number) => `$${value.toFixed(value >= 10 ? 0 : 2)}`,
      };
    }

    if (metric.format === 'context') {
      const upperBound = Math.ceil(maxVal * 1.1);
      return {
        domain: [0, upperBound],
        tickFormatter: (value: number) => {
          if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
          if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
          return String(value);
        },
      };
    }

    return {
      domain: [Math.min(0, minVal), Math.ceil(maxVal * 1.1)],
      tickFormatter: (value: number) => value.toLocaleString(),
    };
  }, [chartData, metric.format]);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] text-muted-foreground">
        No data available for this metric
      </div>
    );
  }

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{ payload: ChartDataItem }>;
  }) => {
    if (!active || !payload || !payload[0]) return null;
    const data = payload[0].payload;
    const isArenaMetric =
      metric.field === 'code_arena_score' || metric.field === 'chat_arena_score';
    const rawScores = data.arenaRawScores;

    return (
      <div className="bg-popover border border-border rounded-lg shadow-lg p-3 min-w-[200px]">
        <p className="font-medium text-sm text-foreground">{data.name}</p>
        <p className="text-xs text-muted-foreground mb-2">{data.organization}</p>
        <p className="text-sm font-semibold" style={{ color: data.color }}>
          {metric.label}: {formatMetricValue(data.value, metric.format)}
        </p>

        {isArenaMetric && rawScores && (
          <div className="mt-2 pt-2 border-t border-border space-y-1">
            <p className="text-xs text-muted-foreground font-medium">
              {metric.field === 'code_arena_score' ? 'Sub-scores (avg × 100):' : 'Raw × 100:'}
            </p>
            {metric.field === 'chat_arena_score' && rawScores['chat-arena'] !== undefined && (
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">chat-arena:</span>
                <span className="tabular-nums">{rawScores['chat-arena'].toFixed(2)}</span>
              </div>
            )}
            {metric.field === 'code_arena_score' &&
              (Object.keys(CODE_ARENA_LABELS) as (keyof ArenaScores)[]).map((key) => {
                const score = rawScores[key];
                if (score === undefined || score === null) return null;
                return (
                  <div key={key} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{CODE_ARENA_LABELS[key]}:</span>
                    <span
                      className={`tabular-nums ${score >= 0 ? 'text-green-600' : 'text-red-500'}`}
                    >
                      {score.toFixed(2)}
                    </span>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    );
  };

  const CustomXAxisTick = ({
    x,
    y,
    payload,
  }: {
    x?: number;
    y?: number;
    payload?: { value: string };
  }) => {
    if (!x || !y || !payload) return null;
    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          dy={8}
          textAnchor="end"
          fill="currentColor"
          className="text-[10px] fill-muted-foreground"
          transform="rotate(-45)"
        >
          {payload.value}
        </text>
      </g>
    );
  };

  return (
    <div className="w-full h-[500px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 20, left: 20, bottom: 120 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/50" />
          <XAxis
            dataKey="shortName"
            tick={CustomXAxisTick}
            interval={0}
            axisLine={false}
            tickLine={false}
            height={100}
          />
          <YAxis
            domain={yAxisConfig.domain}
            tickFormatter={yAxisConfig.tickFormatter}
            axisLine={false}
            tickLine={false}
            className="text-xs"
            tick={{ fill: 'currentColor', className: 'fill-muted-foreground' }}
            width={60}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={50}>
            {chartData.map((entry) => (
              <Cell
                key={entry.modelId}
                fill={entry.color}
                className="hover:opacity-80 transition-opacity cursor-pointer"
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
