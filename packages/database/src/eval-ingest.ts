import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { db as defaultDb } from './db';
import type * as schema from './schema';
import {
  type EvalRun,
  type EvalRunStatus,
  evalRuns,
  type NewEvalRun,
  type NewRunScore,
  runScores,
} from './schema';

type Database = PostgresJsDatabase<typeof schema>;

/** A single per-task / per-trial score row as emitted by the runner (snake_case). */
export interface RunScoreInput {
  task_slug: string;
  metric: string; // 'f1' | 'passed' | 'cost_usd' | 'latency_ms'
  value: number;
  trial?: number;
}

/**
 * Engine → DB ingestion payload (contract §3). The runner emits one of these
 * per matrix cell, using snake_case keys that map to the camelCase Drizzle schema.
 */
export interface EvalRunIngestPayload {
  harness: string; // 'oh-my-claudecode' | 'bare-agent.md'
  model_id: string; // 'ollama/qwen3:8b' | 'kimi-k2-...'
  suite: string; // 'legal_contract_review'
  domain: string; // 'legal'
  k?: number;
  pass_at_1?: number | null;
  pass_hat_k?: number | null;
  f1?: number | null;
  cost_usd?: number | null;
  latency_ms?: number | null;
  total_tokens?: number | null;
  runner_image_digest?: string | null;
  suite_hash?: string | null;
  per_task?: RunScoreInput[];
  // Optional DB-side fields not present in the raw runner JSON.
  agent_id?: string | null;
  status?: EvalRunStatus;
  triggered_by?: string | null;
  finished_at?: Date | string | null;
}

/**
 * Pure mapping from the snake_case ingestion payload to the camelCase Drizzle
 * insert shapes. Separated from the DB call so it can be unit-tested in isolation.
 */
export function mapEvalRunPayload(payload: EvalRunIngestPayload): {
  run: NewEvalRun;
  scores: Array<Omit<NewRunScore, 'id' | 'runId'>>;
} {
  const run: NewEvalRun = {
    agentId: payload.agent_id ?? null,
    harness: payload.harness,
    modelId: payload.model_id,
    suite: payload.suite,
    domain: payload.domain,
    status: payload.status ?? 'scored',
    k: payload.k ?? 1,
    passAt1: payload.pass_at_1 ?? null,
    passHatK: payload.pass_hat_k ?? null,
    f1: payload.f1 ?? null,
    costUsd: payload.cost_usd ?? null,
    latencyMs: payload.latency_ms ?? null,
    totalTokens: payload.total_tokens ?? null,
    runnerImageDigest: payload.runner_image_digest ?? null,
    suiteHash: payload.suite_hash ?? null,
    triggeredBy: payload.triggered_by ?? null,
  };

  if (payload.finished_at != null) {
    run.finishedAt =
      typeof payload.finished_at === 'string' ? new Date(payload.finished_at) : payload.finished_at;
  }

  const scores = (payload.per_task ?? []).map((t) => ({
    taskSlug: t.task_slug,
    metric: t.metric,
    value: t.value,
    trial: t.trial ?? 0,
  }));

  return { run, scores };
}

/**
 * Insert one `eval_runs` row plus its fanned-out `run_scores` rows from a single
 * runner payload. Runs inside a transaction so a partial failure leaves no
 * orphaned run. Returns the inserted `eval_runs` row.
 */
export async function ingestEvalRun(
  payload: EvalRunIngestPayload,
  database: Database = defaultDb,
): Promise<EvalRun> {
  const { run, scores } = mapEvalRunPayload(payload);

  return database.transaction(async (tx) => {
    const [inserted] = await tx.insert(evalRuns).values(run).returning();
    if (!inserted) {
      throw new Error('Failed to insert eval_run: no row returned');
    }

    if (scores.length > 0) {
      await tx.insert(runScores).values(scores.map((s) => ({ ...s, runId: inserted.id })));
    }

    return inserted;
  });
}
