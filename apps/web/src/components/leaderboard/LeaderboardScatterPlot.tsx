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
import {
  formatMetricValue,
  getNumericValue,
  getOrganizationColor,
  type MetricConfig,
} from '@/libs/zeroeval-api';
import type { LeaderboardModel } from './types';

interface LeaderboardScatterPlotProps {
  models: LeaderboardModel[];
  xMetric: MetricConfig;
  yMetric: MetricConfig;
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

export function LeaderboardScatterPlot({ models, xMetric, yMetric }: LeaderboardScatterPlotProps) {
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

    const scatterData: ScatterDataPoint[] = validModels.map((model) => {
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
        color: getOrganizationColor(model.organization_id),
      };
    });

    return { scatterData, xDomain, yDomain };
  }, [models, xMetric, yMetric]);

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
    if (!active || !payload || !payload[0]) return null;
    const data = payload[0].payload;
    return (
      <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
        <p className="font-medium text-sm text-foreground">{data.name}</p>
        <p className="text-xs text-muted-foreground">{data.organization}</p>
        <div className="mt-1 space-y-0.5 text-sm">
          <p style={{ color: data.color }}>
            {xMetric.label}: {formatMetricValue(data.x, xMetric.format)}
          </p>
          <p style={{ color: data.color }}>
            {yMetric.label}: {formatMetricValue(data.y, yMetric.format)}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-[500px]">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 20, right: 20, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
          <XAxis
            type="number"
            dataKey="x"
            domain={xDomain}
            tickFormatter={getTickFormatter(xMetric)}
            axisLine={false}
            tickLine={false}
            className="text-xs"
            tick={{ fill: 'currentColor', className: 'fill-muted-foreground' }}
          >
            <Label
              value={xMetric.label}
              position="bottom"
              offset={10}
              className="fill-muted-foreground text-xs"
            />
          </XAxis>
          <YAxis
            type="number"
            dataKey="y"
            domain={yDomain}
            tickFormatter={getTickFormatter(yMetric)}
            axisLine={false}
            tickLine={false}
            className="text-xs"
            tick={{ fill: 'currentColor', className: 'fill-muted-foreground' }}
            width={60}
          >
            <Label
              value={yMetric.label}
              angle={-90}
              position="insideLeft"
              offset={0}
              className="fill-muted-foreground text-xs"
              style={{ textAnchor: 'middle' }}
            />
          </YAxis>
          <ZAxis type="number" dataKey="z" range={[80, 80]} />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ strokeDasharray: '3 3', className: 'stroke-muted-foreground' }}
          />
          <Scatter data={scatterData}>
            {scatterData.map((entry) => (
              <Cell
                key={entry.modelId}
                fill={entry.color}
                className="hover:opacity-80 transition-opacity cursor-pointer"
              />
            ))}
            <LabelList
              dataKey="name"
              position="right"
              offset={8}
              className="fill-muted-foreground"
              style={{ fontSize: '10px' }}
            />
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
