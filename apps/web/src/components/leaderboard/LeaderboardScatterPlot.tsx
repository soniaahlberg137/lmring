'use client';

import { useMemo } from 'react';
import {
  CartesianGrid,
  Cell,
  Label,
  LabelList,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';
import { computeParetoFrontier } from '@/libs/pareto-frontier';
import { formatMetricValue, getNumericValue, type MetricConfig } from '@/libs/zeroeval-api';
import type { LeaderboardModel } from './types';

interface LeaderboardScatterPlotProps {
  models: LeaderboardModel[];
  xMetric: MetricConfig;
  yMetric: MetricConfig;
  // Tessera: overlay the perf-vs-cost Pareto frontier (higher y + lower x dominates).
  showFrontier?: boolean;
}

interface ScatterDataPoint {
  x: number;
  y: number;
  z: number; // for bubble size (constant)
  name: string;
  organization: string;
  modelId: string;
  color: string;
}

// Muted Bioluminescent - Softer sci-fi palette, easier on eyes in dark mode
// Reduced brightness and saturation for visual comfort
const SCATTER_COLORS = [
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

function getScatterColor(index: number): string {
  return SCATTER_COLORS[index % SCATTER_COLORS.length] ?? '#5BB8CC';
}

export function LeaderboardScatterPlot({
  models,
  xMetric,
  yMetric,
  showFrontier = false,
}: LeaderboardScatterPlotProps) {
  const { scatterData, xDomain, yDomain } = useMemo(() => {
    const validModels = models.filter((m) => {
      const xVal = m[xMetric.field as keyof typeof m];
      const yVal = m[yMetric.field as keyof typeof m];
      return (
        xVal !== null &&
        xVal !== undefined &&
        xVal !== '' &&
        yVal !== null &&
        yVal !== undefined &&
        yVal !== ''
      );
    });

    if (validModels.length === 0) {
      return {
        scatterData: [],
        xDomain: [0, 1] as [number, number],
        yDomain: [0, 1] as [number, number],
      };
    }

    const xValues = validModels.map((m) =>
      getNumericValue(m[xMetric.field as keyof typeof m] as string | number | null),
    );
    const yValues = validModels.map((m) =>
      getNumericValue(m[yMetric.field as keyof typeof m] as string | number | null),
    );

    const xMin = Math.min(...xValues);
    const xMax = Math.max(...xValues);
    const yMin = Math.min(...yValues);
    const yMax = Math.max(...yValues);

    const xPadding = (xMax - xMin) * 0.1 || 1;
    const yPadding = (yMax - yMin) * 0.1 || 1;

    const xDomain: [number, number] = [Math.max(0, xMin - xPadding), xMax + xPadding];
    const yDomain: [number, number] = [Math.max(0, yMin - yPadding), yMax + yPadding];

    const scatterData: ScatterDataPoint[] = validModels.map((model, index) => {
      const x = getNumericValue(
        model[xMetric.field as keyof typeof model] as string | number | null,
      );
      const y = getNumericValue(
        model[yMetric.field as keyof typeof model] as string | number | null,
      );

      return {
        x,
        y,
        z: 100, // constant size for all points
        name: model.name,
        organization: model.organization,
        modelId: model.model_id,
        color: getScatterColor(index),
      };
    });

    return { scatterData, xDomain, yDomain };
  }, [models, xMetric, yMetric]);

  // Tessera: non-dominated (Pareto) frontier — higher y (perf) + lower x (cost/latency) wins.
  const frontierData = useMemo(
    () => (showFrontier ? computeParetoFrontier(scatterData) : []),
    [showFrontier, scatterData],
  );

  const getTickFormatter = (metric: MetricConfig) => {
    return (value: number) => {
      if (metric.format === 'percentage') {
        return `${(value * 100).toFixed(0)}%`;
      }
      if (metric.format === 'currency') {
        return `$${value.toFixed(value >= 10 ? 0 : 2)}`;
      }
      if (metric.format === 'context') {
        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
        return String(value);
      }
      return value.toLocaleString();
    };
  };

  if (scatterData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[500px] text-muted-foreground">
        No data available for these metrics
      </div>
    );
  }

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{ payload: ScatterDataPoint }>;
  }) => {
    if (!active || !payload?.[0]) return null;
    const data = payload[0].payload;
    return (
      <div className="bg-popover/95 backdrop-blur-sm border border-border rounded-lg shadow-xl p-3">
        <p className="font-semibold text-sm text-foreground">{data.name}</p>
        <p className="text-[10px] text-muted-foreground">{data.organization}</p>
        <div className="mt-2 space-y-1 text-xs">
          <p style={{ color: data.color }}>
            {xMetric.label}:{' '}
            <span className="tabular-nums">{formatMetricValue(data.x, xMetric.format)}</span>
          </p>
          <p style={{ color: data.color }}>
            {yMetric.label}:{' '}
            <span className="tabular-nums">{formatMetricValue(data.y, yMetric.format)}</span>
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-[500px]">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 24, right: 24, left: 20, bottom: 56 }}>
          {/* Subtle grid */}
          <CartesianGrid strokeDasharray="3 6" strokeOpacity={0.08} stroke="currentColor" />
          {/* X-Axis */}
          <XAxis
            type="number"
            dataKey="x"
            domain={xDomain}
            tickFormatter={getTickFormatter(xMetric)}
            axisLine={false}
            tickLine={false}
            tick={{
              fontSize: 11,
              fontWeight: 500,
            }}
            tickMargin={10}
            className="fill-foreground/50"
          >
            <Label
              value={xMetric.label}
              position="bottom"
              offset={12}
              className="fill-foreground/60"
              style={{ fontSize: 12, fontWeight: 500 }}
            />
          </XAxis>
          {/* Y-Axis */}
          <YAxis
            type="number"
            dataKey="y"
            domain={yDomain}
            tickFormatter={getTickFormatter(yMetric)}
            axisLine={false}
            tickLine={false}
            tick={{
              fontSize: 11,
              fontWeight: 500,
            }}
            tickMargin={8}
            width={55}
            className="fill-foreground/50"
          >
            <Label
              value={yMetric.label}
              angle={-90}
              position="insideLeft"
              offset={8}
              className="fill-foreground/60"
              style={{ fontSize: 12, fontWeight: 500, textAnchor: 'middle' }}
            />
          </YAxis>
          <ZAxis type="number" dataKey="z" range={[50, 50]} />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ strokeDasharray: '3 3', stroke: 'currentColor', strokeOpacity: 0.2 }}
          />
          <Scatter data={scatterData}>
            {scatterData.map((entry) => (
              <Cell
                key={entry.modelId}
                fill={entry.color}
                fillOpacity={0.8}
                className="hover:!opacity-100 transition-opacity cursor-pointer"
              />
            ))}
            <LabelList
              dataKey="name"
              position="right"
              offset={8}
              className="fill-foreground/40"
              style={{ fontSize: 9, fontWeight: 400 }}
            />
          </Scatter>
          {/* Pareto frontier overlay: connect the non-dominated points. */}
          {frontierData.length > 1 && (
            <Scatter
              data={frontierData}
              line={{ stroke: '#5BB8CC', strokeWidth: 2, strokeDasharray: '5 4' }}
              lineJointType="linear"
              shape={() => <g />}
              legendType="none"
              isAnimationActive={false}
            />
          )}
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
