'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@lmring/ui';
import type { MetricConfig } from '@/libs/zeroeval-api';

interface MetricSelectorProps {
  metrics: MetricConfig[];
  selectedMetric: string;
  onMetricChange: (metricId: string) => void;
  label?: string;
  inline?: boolean;
}

export function MetricSelector({
  metrics,
  selectedMetric,
  onMetricChange,
  label,
  inline = false,
}: MetricSelectorProps) {
  return (
    <div className={inline ? 'flex items-center gap-2' : 'flex flex-col gap-1.5'}>
      {label && (
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap">
          {label}
        </span>
      )}
      <Select value={selectedMetric} onValueChange={onMetricChange}>
        <SelectTrigger className="w-[140px] h-8 text-sm">
          <SelectValue placeholder="Select metric" />
        </SelectTrigger>
        <SelectContent>
          {metrics.map((metric) => (
            <SelectItem key={metric.id} value={metric.id}>
              {metric.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
