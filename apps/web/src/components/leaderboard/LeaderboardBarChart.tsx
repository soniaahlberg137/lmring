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

// Muted Bioluminescent - Softer sci-fi palette, easier on eyes in dark mode
// Reduced brightness and saturation for visual comfort
const CHART_COLORS = [
  '#5BB8CC', // Soft Cyan
  '#8B7ACC', // Muted Violet
  '#4DB89A', // Sage Green
  '#CC7A8F', // Dusty Rose
  '#CCA055', // Warm Bronze
  '#7A9FCC', // Slate Blue
  '#A67ACC', // Soft Purple
  '#4DA8A0', // Muted Teal
  '#CC8A6A', // Terracotta
  '#9AA3CC', // Cool Lavender
  '#5CC9A8', // Seafoam
  '#CC6A85', // Muted Coral
];

function getChartColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length] ?? '#5BB8CC';
}

export function LeaderboardBarChart({ models, metric, maxItems = 15 }: LeaderboardBarChartProps) {
  const chartData = useMemo<ChartDataItem[]>(() => {
    const filtered = models
      .filter((m) => {
        const val = m[metric.field as keyof typeof m];
        return val !== null && val !== undefined && val !== '';
      })
      .slice(0, maxItems);

    return filtered.map((model, index) => {
      const value = getNumericValue(
        model[metric.field as keyof typeof model] as string | number | null,
      );
      return {
        name: model.name,
        shortName: model.name.length > 18 ? `${model.name.slice(0, 16)}…` : model.name,
        value,
        color: getChartColor(index),
        organization: model.organization,
        modelId: model.model_id,
        arenaRawScores: model.arena_raw_scores,
      };
    });
  }, [models, metric, maxItems]);

  const xAxisConfig = useMemo(() => {
    if (chartData.length === 0) return { domain: [0, 1], tickFormatter: (v: number) => String(v) };

    const values = chartData.map((d) => d.value).filter((v) => v > -Infinity);
    const maxVal = Math.max(...values, 0);
    const minVal = Math.min(...values, 0);

    if (metric.format === 'percentage') {
      // Use dynamic range to show differences better
      const range = maxVal - minVal;
      const padding = range * 0.15 || 0.05;
      const lowerBound = Math.max(0, Math.floor((minVal - padding) * 100) / 100);
      const upperBound = Math.min(1, Math.ceil((maxVal + padding / 2) * 100) / 100);
      return {
        domain: [lowerBound, upperBound],
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
      <div className="bg-popover/95 backdrop-blur-sm border border-border rounded-lg shadow-xl p-3 min-w-[180px]">
        <p className="font-semibold text-sm text-foreground">{data.name}</p>
        <p className="text-[10px] text-muted-foreground mb-2">{data.organization}</p>
        <p className="text-xl font-bold tabular-nums" style={{ color: data.color }}>
          {formatMetricValue(data.value, metric.format)}
        </p>
        <p className="text-[10px] text-muted-foreground mt-1">{metric.label}</p>

        {isArenaMetric && rawScores && (
          <div className="mt-2 pt-2 border-t border-border space-y-1">
            <p className="text-[10px] text-muted-foreground font-medium">
              {metric.field === 'code_arena_score' ? 'Sub-scores (avg × 100):' : 'Raw × 100:'}
            </p>
            {metric.field === 'chat_arena_score' && rawScores['chat-arena'] !== undefined && (
              <div className="flex justify-between text-[10px]">
                <span className="text-muted-foreground">chat-arena:</span>
                <span className="tabular-nums">{rawScores['chat-arena'].toFixed(2)}</span>
              </div>
            )}
            {metric.field === 'code_arena_score' &&
              (Object.keys(CODE_ARENA_LABELS) as (keyof ArenaScores)[]).map((key) => {
                const score = rawScores[key];
                if (score === undefined || score === null) return null;
                return (
                  <div key={key} className="flex justify-between text-[10px]">
                    <span className="text-muted-foreground">{CODE_ARENA_LABELS[key]}:</span>
                    <span
                      className={`tabular-nums ${score >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}
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

  return (
    <div className="w-full h-[500px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 16, right: 40, left: 16, bottom: 16 }}
        >
          {/* Subtle vertical reference lines */}
          <CartesianGrid
            horizontal={false}
            vertical={true}
            strokeDasharray="3 6"
            strokeOpacity={0.08}
            stroke="currentColor"
          />
          {/* X-Axis: Clean minimal style */}
          <XAxis
            type="number"
            domain={xAxisConfig.domain}
            tickFormatter={xAxisConfig.tickFormatter}
            axisLine={false}
            tickLine={false}
            tick={{
              fontSize: 11,
              fontWeight: 500,
            }}
            tickMargin={12}
            className="fill-foreground/50"
          />
          {/* Y-Axis: Model names */}
          <YAxis
            type="category"
            dataKey="shortName"
            axisLine={false}
            tickLine={false}
            tick={{
              fontSize: 12,
              fontWeight: 400,
            }}
            width={150}
            tickMargin={16}
            className="fill-foreground/80"
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'currentColor', opacity: 0.03 }} />
          <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={18}>
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
