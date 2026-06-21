import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { LegalLeaderboardRow } from './columns';

const { createMockIcon } = vi.hoisted(() => ({
  createMockIcon: (name: string) => {
    const MockIcon = ({ className }: { className?: string }) => (
      <svg data-testid={`icon-${name}`} className={className} />
    );
    MockIcon.displayName = name;
    return MockIcon;
  },
}));

vi.mock('lucide-react', () => ({
  BotIcon: createMockIcon('BotIcon'),
  CheckIcon: createMockIcon('CheckIcon'),
  XIcon: createMockIcon('XIcon'),
  LockIcon: createMockIcon('LockIcon'),
  UnlockIcon: createMockIcon('UnlockIcon'),
  ChevronDown: createMockIcon('ChevronDown'),
  ChevronUp: createMockIcon('ChevronUp'),
}));

vi.mock('@/components/arena/provider-icon', () => ({
  ProviderIcon: ({ providerId }: { providerId: string }) => (
    <div data-testid="provider-icon" data-provider-id={providerId} />
  ),
}));

vi.mock('@/libs/zeroeval-api', () => ({
  formatMetricValue: (value: number | null, format: string) => {
    if (value === null) return '—';
    if (format === 'percentage') return `${(value * 100).toFixed(1)}%`;
    if (format === 'currency') return `$${value.toFixed(2)}`;
    return String(value);
  },
  getNumericValue: (value: string | number | null | undefined) => {
    if (value === null || value === undefined || value === '') return -Infinity;
    if (typeof value === 'number') return value;
    const numericValue = parseFloat(value);
    return Number.isNaN(numericValue) ? -Infinity : numericValue;
  },
}));

const mockT = (key: string) => key;

const mockRow: LegalLeaderboardRow = {
  rank: 1,
  runId: 'fix-1',
  agentName: 'OMC Legal',
  harness: 'oh-my-claudecode',
  baseModel: 'ollama/qwen3:14b',
  organization: 'Tessera',
  domain: 'legal',
  suite: 'legal_contract_review',
  f1: 0.71,
  passAt1: 0.68,
  passHatK: 0.39,
  k: 4,
  costUsd: 0,
  latencyMs: 52000,
  totalTokens: 24100,
  createdAt: '2026-06-20T00:00:00Z',
};

type ColumnWithAccessorKey = { accessorKey?: string; cell?: unknown };

describe('createLegalColumns', () => {
  afterEach(() => {
    cleanup();
  });

  it('creates the assembled-agent column set in order', async () => {
    const { createLegalColumns } = await import('./columns');
    const columns = createLegalColumns(mockT) as ColumnWithAccessorKey[];
    expect(columns.map((c) => c.accessorKey)).toEqual([
      'rank',
      'agentName',
      'harness',
      'baseModel',
      'f1',
      'passAt1',
      'passHatK',
      'costUsd',
      'latencyMs',
    ]);
  });

  it('renders the agent name with a bot icon', async () => {
    const { createLegalColumns } = await import('./columns');
    const columns = createLegalColumns(mockT);
    // biome-ignore lint/style/noNonNullAssertion: column existence verified above
    const agentColumn = columns[1]!;
    const Cell = agentColumn.cell as unknown as React.FC<{
      row: { original: LegalLeaderboardRow };
    }>;
    render(<Cell row={{ original: mockRow }} />);
    expect(screen.getByTestId('icon-BotIcon')).toBeInTheDocument();
    expect(screen.getByText('OMC Legal')).toBeInTheDocument();
  });

  it('renders the F1 metric formatted as a percentage', async () => {
    const { createLegalColumns } = await import('./columns');
    const columns = createLegalColumns(mockT);
    // biome-ignore lint/style/noNonNullAssertion: column existence verified above
    const f1Column = columns[4]!;
    const Cell = f1Column.cell as unknown as React.FC<{ row: { original: LegalLeaderboardRow } }>;
    render(<Cell row={{ original: mockRow }} />);
    expect(screen.getByText('71.0%')).toBeInTheDocument();
  });

  it('renders latency with a ms suffix and thousands separators', async () => {
    const { createLegalColumns } = await import('./columns');
    const columns = createLegalColumns(mockT);
    // biome-ignore lint/style/noNonNullAssertion: column existence verified above
    const latencyColumn = columns[8]!;
    const Cell = latencyColumn.cell as unknown as React.FC<{
      row: { original: LegalLeaderboardRow };
    }>;
    render(<Cell row={{ original: mockRow }} />);
    expect(screen.getByText('52,000 ms')).toBeInTheDocument();
  });

  it('renders an em dash for null latency', async () => {
    const { createLegalColumns } = await import('./columns');
    const columns = createLegalColumns(mockT);
    // biome-ignore lint/style/noNonNullAssertion: column existence verified above
    const latencyColumn = columns[8]!;
    const Cell = latencyColumn.cell as unknown as React.FC<{
      row: { original: LegalLeaderboardRow };
    }>;
    render(<Cell row={{ original: { ...mockRow, latencyMs: null } }} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
