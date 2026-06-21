import { beforeEach, describe, expect, it, vi } from 'vitest';

const { insertCalls, mockTransaction } = vi.hoisted(() => ({
  insertCalls: [] as Array<{ table: unknown; values: unknown }>,
  mockTransaction: vi.fn(),
}));

vi.mock('./db', () => ({
  db: {
    transaction: mockTransaction,
  },
}));

import { type EvalRunIngestPayload, ingestEvalRun, mapEvalRunPayload } from './eval-ingest';
import { evalRuns, runScores } from './schema';

const basePayload: EvalRunIngestPayload = {
  harness: 'bare-agent.md',
  model_id: 'ollama/qwen3:8b',
  suite: 'legal_contract_review',
  domain: 'legal',
  k: 4,
  pass_at_1: 0.62,
  pass_hat_k: 0.31,
  f1: 0.58,
  cost_usd: 0.0,
  latency_ms: 41230,
  total_tokens: 18450,
  runner_image_digest: null,
  suite_hash: 'sha256:abc',
  per_task: [
    { task_slug: 'cuad-0001', metric: 'f1', value: 0.6, trial: 0 },
    { task_slug: 'cuad-0002', metric: 'passed', value: 1, trial: 1 },
  ],
};

describe('mapEvalRunPayload', () => {
  it('maps snake_case payload to camelCase run insert shape', () => {
    const { run } = mapEvalRunPayload(basePayload);

    expect(run).toEqual({
      agentId: null,
      harness: 'bare-agent.md',
      modelId: 'ollama/qwen3:8b',
      suite: 'legal_contract_review',
      domain: 'legal',
      status: 'scored',
      k: 4,
      passAt1: 0.62,
      passHatK: 0.31,
      f1: 0.58,
      costUsd: 0.0,
      latencyMs: 41230,
      totalTokens: 18450,
      runnerImageDigest: null,
      suiteHash: 'sha256:abc',
      triggeredBy: null,
    });
  });

  it('fans out per_task entries into camelCase score rows', () => {
    const { scores } = mapEvalRunPayload(basePayload);

    expect(scores).toEqual([
      { taskSlug: 'cuad-0001', metric: 'f1', value: 0.6, trial: 0 },
      { taskSlug: 'cuad-0002', metric: 'passed', value: 1, trial: 1 },
    ]);
  });

  it('applies defaults for omitted optional fields', () => {
    const { run, scores } = mapEvalRunPayload({
      harness: 'oh-my-claudecode',
      model_id: 'ollama/qwen3:14b',
      suite: 'legal_contract_review',
      domain: 'legal',
    });

    expect(run.status).toBe('scored');
    expect(run.k).toBe(1);
    expect(run.passAt1).toBeNull();
    expect(run.f1).toBeNull();
    expect(run.totalTokens).toBeNull();
    expect(scores).toEqual([]);
  });

  it('defaults per_task trial to 0 when omitted', () => {
    const { scores } = mapEvalRunPayload({
      ...basePayload,
      per_task: [{ task_slug: 'cuad-0003', metric: 'f1', value: 0.4 }],
    });

    expect(scores).toEqual([{ taskSlug: 'cuad-0003', metric: 'f1', value: 0.4, trial: 0 }]);
  });

  it('honors explicit DB-side overrides and coerces finished_at strings to Date', () => {
    const { run } = mapEvalRunPayload({
      ...basePayload,
      agent_id: 'agent-1',
      status: 'failed',
      triggered_by: 'user-1',
      finished_at: '2026-06-20T00:00:00Z',
    });

    expect(run.agentId).toBe('agent-1');
    expect(run.status).toBe('failed');
    expect(run.triggeredBy).toBe('user-1');
    expect(run.finishedAt).toBeInstanceOf(Date);
    expect((run.finishedAt as Date).toISOString()).toBe('2026-06-20T00:00:00.000Z');
  });
});

describe('ingestEvalRun', () => {
  beforeEach(() => {
    insertCalls.length = 0;
    mockTransaction.mockReset();
    mockTransaction.mockImplementation(async (cb: (tx: unknown) => unknown) => {
      const tx = {
        insert: (table: unknown) => ({
          values: (values: unknown) => {
            insertCalls.push({ table, values });
            return {
              returning: async () => [{ id: 'run-uuid-1' }],
            };
          },
        }),
      };
      return cb(tx);
    });
  });

  it('inserts an eval_runs row then the fanned-out run_scores rows', async () => {
    const result = await ingestEvalRun(basePayload);

    expect(mockTransaction).toHaveBeenCalledTimes(1);
    expect(insertCalls).toHaveLength(2);

    // First insert: eval_runs row
    const runInsert = insertCalls[0]!;
    expect(runInsert.table).toBe(evalRuns);
    expect(runInsert.values).toMatchObject({
      harness: 'bare-agent.md',
      modelId: 'ollama/qwen3:8b',
      suite: 'legal_contract_review',
      domain: 'legal',
      f1: 0.58,
    });

    // Second insert: run_scores rows, each carrying the new runId
    const scoresInsert = insertCalls[1]!;
    expect(scoresInsert.table).toBe(runScores);
    expect(scoresInsert.values).toEqual([
      { taskSlug: 'cuad-0001', metric: 'f1', value: 0.6, trial: 0, runId: 'run-uuid-1' },
      { taskSlug: 'cuad-0002', metric: 'passed', value: 1, trial: 1, runId: 'run-uuid-1' },
    ]);

    expect(result).toEqual({ id: 'run-uuid-1' });
  });

  it('skips the run_scores insert when there are no per_task entries', async () => {
    await ingestEvalRun({ ...basePayload, per_task: [] });

    expect(insertCalls).toHaveLength(1);
    expect(insertCalls[0]!.table).toBe(evalRuns);
  });
});
