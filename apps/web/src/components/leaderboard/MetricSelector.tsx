'use client';

import { cn } from '@lmring/ui';
import { ChevronDown } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
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
}: MetricSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedConfig = metrics.find((m) => m.id === selectedMetric);

  const handleSelect = useCallback(
    (metricId: string) => {
      onMetricChange(metricId);
      setIsOpen(false);
    },
    [onMetricChange],
  );

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'group flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer',
          'bg-muted/40 hover:bg-muted/60 border border-border/50',
          'transition-all duration-150 ease-out',
          isOpen && 'bg-muted/60 ring-2 ring-ring/20',
        )}
      >
        {label && (
          <span className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider">
            {label}
          </span>
        )}
        <span className="text-sm font-medium text-foreground">{selectedConfig?.label || '—'}</span>
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 text-muted-foreground/60 transition-transform duration-150',
            isOpen && 'rotate-180',
          )}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={cn(
            'absolute top-full left-0 mt-1.5 z-50 min-w-[160px]',
            'bg-popover/95 backdrop-blur-sm border border-border/50 rounded-lg shadow-lg',
            'py-1 animate-in fade-in-0 zoom-in-95 duration-100',
          )}
        >
          {metrics.map((metric) => {
            const isSelected = metric.id === selectedMetric;
            return (
              <button
                type="button"
                key={metric.id}
                onClick={() => handleSelect(metric.id)}
                className={cn(
                  'w-full px-3 py-1.5 text-left text-sm cursor-pointer',
                  'transition-colors duration-100',
                  isSelected
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-foreground/80 hover:bg-muted/50 hover:text-foreground',
                )}
              >
                {metric.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
