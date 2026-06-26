'use client';

import { Card, CardContent, cn } from '@lmring/ui';
import { CheckIcon } from 'lucide-react';
import { useState } from 'react';
import { type AgentDomainFilter, DomainTabs } from '@/components/leaderboard/DomainTabs';
import { type ModelWithArena, useLeaderboardData } from '@/hooks/use-leaderboard-query';

const MAX_COMPARE = 3;

interface MetricDef {
  label: string;
  field: string;
  higherIsBetter: boolean;
  format: 'percent' | 'price';
}

const BENCHMARK_METRICS: MetricDef[] = [
  { label: 'GAIA', field: 'gaia_score', higherIsBetter: true, format: 'percent' },
  {
    label: 'SWE-bench',
    field: 'swe_bench_verified_score',
    higherIsBetter: true,
    format: 'percent',
  },
  { label: 'tau-bench', field: 'tau_bench_score', higherIsBetter: true, format: 'percent' },
  { label: 'CORE-bench', field: 'core_bench_score', higherIsBetter: true, format: 'percent' },
];

// Which benchmarks are relevant for each domain
const DOMAIN_BENCHMARKS: Record<AgentDomainFilter, MetricDef[]> = {
  all: BENCHMARK_METRICS,
  coding: [
    {
      label: 'SWE-bench',
      field: 'swe_bench_verified_score',
      higherIsBetter: true,
      format: 'percent',
    },
  ],
  research: [
    { label: 'GAIA', field: 'gaia_score', higherIsBetter: true, format: 'percent' },
    { label: 'CORE-bench', field: 'core_bench_score', higherIsBetter: true, format: 'percent' },
  ],
  'customer-support': [
    { label: 'tau-bench', field: 'tau_bench_score', higherIsBetter: true, format: 'percent' },
  ],
  finance: [
    { label: 'GAIA', field: 'gaia_score', higherIsBetter: true, format: 'percent' },
    { label: 'tau-bench', field: 'tau_bench_score', higherIsBetter: true, format: 'percent' },
  ],
  legal: [{ label: 'GAIA', field: 'gaia_score', higherIsBetter: true, format: 'percent' }],
  general: BENCHMARK_METRICS,
};

const COST_METRICS: MetricDef[] = [
  { label: 'Input $/M', field: 'input_price', higherIsBetter: false, format: 'price' },
  { label: 'Output $/M', field: 'output_price', higherIsBetter: false, format: 'price' },
];

function formatValue(value: unknown, format: 'percent' | 'price'): string {
  if (value === null || value === undefined) return '—';
  if (format === 'percent') {
    const n = Number(value);
    return Number.isNaN(n) ? '—' : `${(n * 100).toFixed(1)}%`;
  }
  const n = parseFloat(String(value));
  return Number.isNaN(n) ? '—' : `$${n.toFixed(2)}`;
}

function getBestIndex(values: unknown[], higherIsBetter: boolean): number | null {
  const nums = values.map((v) => (v === null || v === undefined ? null : Number(v)));
  const nonNull = nums.filter((n): n is number => n !== null && !Number.isNaN(n));
  if (nonNull.length < 2) return null;
  const allSame = nonNull.every((n) => n === nonNull[0]);
  if (allSame) return null;
  const best = higherIsBetter ? Math.max(...nonNull) : Math.min(...nonNull);
  return nums.indexOf(best);
}

function MetricRows({ metrics, selected }: { metrics: MetricDef[]; selected: ModelWithArena[] }) {
  return metrics.map((metric) => {
    const values = selected.map((a) => (a as unknown as Record<string, unknown>)[metric.field]);
    const bestIdx = getBestIndex(values, metric.higherIsBetter);

    return (
      <tr key={metric.field} className="border-b border-border/30 last:border-0">
        <td className="px-5 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">
          {metric.label}
          <span className="ml-1.5 text-muted-foreground/40">
            {metric.higherIsBetter ? '↑' : '↓'}
          </span>
        </td>
        {values.map((val, colIdx) => {
          const isWinner = colIdx === bestIdx;
          const formatted = formatValue(val, metric.format);
          const isEmpty = formatted === '—';
          return (
            <td
              key={selected[colIdx]?.model_id}
              className={cn(
                'px-5 py-3 text-center tabular-nums text-sm',
                isWinner
                  ? 'bg-primary/10 font-semibold text-primary'
                  : isEmpty
                    ? 'text-muted-foreground/40'
                    : 'text-foreground',
              )}
            >
              {formatted}
              {isWinner && <span className="ml-1 text-xs opacity-70">★</span>}
            </td>
          );
        })}
      </tr>
    );
  });
}

export default function ComparePage() {
  const { data: allModels = [] } = useLeaderboardData('all');
  // Only show agent rows (submitted Tessera agents have an agent_name)
  const agents = allModels.filter((m) => m.agent_name);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [domain, setDomain] = useState<AgentDomainFilter>('all');

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, id];
    });
  };

  const selected = selectedIds
    .map((id) => agents.find((a) => a.model_id === id))
    .filter((a): a is ModelWithArena => a !== undefined);

  const remaining = 2 - selected.length;

  return (
    <div className="p-6 space-y-6">
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h1 className="text-2xl font-medium text-foreground">Compare Agents</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Select 2–3 agents to compare side-by-side
        </p>
      </div>

      {/* Agent selector */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {agents.map((agent) => {
          const isSelected = selectedIds.includes(agent.model_id);
          const isDisabled = !isSelected && selectedIds.length >= MAX_COMPARE;

          return (
            <button
              key={agent.model_id}
              type="button"
              onClick={() => toggle(agent.model_id)}
              disabled={isDisabled}
              className={cn(
                'relative text-left rounded-lg border px-4 py-3 transition-all duration-150',
                isSelected
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border bg-card hover:border-primary/40 hover:bg-muted/50',
                isDisabled && 'opacity-40 cursor-not-allowed hover:border-border hover:bg-card',
              )}
            >
              {isSelected && (
                <span className="absolute top-2.5 right-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                  <CheckIcon className="h-2.5 w-2.5 text-primary-foreground" />
                </span>
              )}
              <p className="text-sm font-semibold text-foreground pr-5 leading-tight truncate">
                {agent.agent_name}
              </p>
              <p className="text-xs text-muted-foreground mt-1 truncate">{agent.name}</p>
            </button>
          );
        })}
      </div>

      {/* Comparison table or empty state */}
      {selected.length >= 2 ? (
        <>
          {/* Domain selector — controls which benchmarks are shown */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Compare on:</span>
            <DomainTabs activeDomain={domain} onDomainChange={setDomain} />
          </div>

          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm">
                {/* Agent headers */}
                <thead>
                  <tr className="border-b border-border/50 bg-muted/20">
                    <th className="px-5 py-4 text-left w-36" />
                    {selected.map((agent) => (
                      <th key={agent.model_id} className="px-5 py-4 text-center min-w-40">
                        <div className="text-sm font-semibold text-foreground">
                          {agent.agent_name}
                        </div>
                        <div className="text-xs text-muted-foreground font-normal mt-0.5">
                          {agent.name}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Benchmark scores section */}
                  <tr className="border-b border-border/30 bg-muted/10">
                    <td
                      colSpan={selected.length + 1}
                      className="px-5 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                    >
                      Benchmark Scores
                    </td>
                  </tr>
                  <MetricRows metrics={DOMAIN_BENCHMARKS[domain]} selected={selected} />

                  {/* Cost section */}
                  <tr className="border-b border-border/50 bg-muted/10">
                    <td
                      colSpan={selected.length + 1}
                      className="px-5 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                    >
                      API Pricing
                    </td>
                  </tr>
                  <MetricRows metrics={COST_METRICS} selected={selected} />
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-48 rounded-lg border border-dashed border-border gap-2">
          <p className="text-sm text-muted-foreground">
            {remaining === 2
              ? 'Select at least 2 agents to compare'
              : 'Select 1 more agent to see the comparison'}
          </p>
        </div>
      )}
    </div>
  );
}
