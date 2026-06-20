import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  unique,
  uuid,
  type PgColumn,
} from 'drizzle-orm/pg-core';

import { apiKeys, type ModelAbilitiesJson, users } from './schema';

// ---------------------------------------------------------------------------
// JSON column types
// ---------------------------------------------------------------------------

// Pinned, declarative manifest for a harness version. Mirrors the
// submitter-controlled `tessera.yaml` config (entrypoint, MCP servers, skills,
// agent.md, memory, model binding) that the platform freezes at submission.
export interface HarnessManifestJson {
  // Container/CLI entrypoint the runner invokes inside the sandbox.
  entrypoint?: string;
  // MCP servers the harness is allowed to use, keyed by server name.
  mcpServers?: Record<
    string,
    {
      command?: string;
      args?: string[];
      url?: string;
      env?: Record<string, string>;
    }
  >;
  // Skill identifiers the harness loads (e.g. oh-my-claudecode skills).
  skills?: string[];
  // Storage ref (e.g. object-store key) to the resolved agent.md / system prompt.
  agentMdRef?: string;
  // Memory seeding config for the harness.
  memory?: {
    ref?: string;
    entries?: string[];
  };
  // Name of the env var the harness reads its model id from (Agent Bridge swap point).
  modelEnvVar?: string;
  // Default invocation params applied to every cell unless overridden.
  defaultParams?: Record<string, unknown>;
}

// Configuration for the grader that scores a benchmark task. Shape varies by
// grader kind: programmatic test gating (FAIL_TO_PASS / PASS_TO_PASS) vs
// LLM-as-judge (reference-guided / pairwise).
export interface GraderConfigJson {
  // Tests that must flip red -> green for a programmatic task to count resolved.
  failToPass?: string[];
  // Tests that must stay green (regression guard).
  passToPass?: string[];
  // Judge model alias for LLM-as-judge grading.
  judgeModel?: string;
  // Rubric / reference-answer ref for judge grading.
  rubricRef?: string;
  referenceRef?: string;
  // Free-form extra params passed to the grader implementation.
  params?: Record<string, unknown>;
}

// Per-result grader OUTPUT (what actually happened), distinct from the grader
// input config above. Written by the engine (Epic 3/4) after a task is graded.
export interface GraderOutputJson {
  // Programmatic gating outcome.
  passed?: boolean;
  failedTests?: string[];
  passedTests?: string[];
  // LLM-as-judge verdict.
  judgeVerdict?: string;
  judgeModel?: string;
  // Numeric breakdown when partial credit applies.
  rawScore?: number;
  // Free-form grader-specific detail.
  details?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const harnessKindEnum = pgEnum('harness_kind', [
  'oh-my-claudecode',
  'claude-code',
  'cline',
  'custom',
]);

export const modelBackendEnum = pgEnum('model_backend', [
  'platform',
  'byo',
]);

export const suiteRotationEnum = pgEnum('suite_rotation', [
  'static',
  'rotating',
  'canary',
]);

export const taskKindEnum = pgEnum('task_kind', [
  'programmatic',
  'llm_judge',
  'agentic',
]);

export const graderKindEnum = pgEnum('grader_kind', [
  'programmatic',
  'llm_judge',
  'external',
]);

export const evalRunStatusEnum = pgEnum('eval_run_status', [
  'queued',
  'running',
  'scored',
  'failed',
  'cancelled',
]);

export const runResultStatusEnum = pgEnum('run_result_status', [
  'pending',
  'running',
  'passed',
  'failed',
  'errored',
  'skipped',
]);

export const evalVisibilityEnum = pgEnum('eval_visibility', [
  'public',
  'private',
  'unlisted',
]);

// ---------------------------------------------------------------------------
// Harnesses & versions
// ---------------------------------------------------------------------------

// Directory entry for an evaluatable agent harness (oh-my-claudecode, Claude
// Code, Cline, custom). Public-read in the catalog.
export const harnesses = pgTable(
  'harnesses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull().unique(),
    name: text('name').notNull(),
    kind: harnessKindEnum('kind').notNull(),
    description: text('description'),
    repoUrl: text('repo_url'),
    homepageUrl: text('homepage_url'),
    license: text('license'),
    maintainer: text('maintainer'),
    submittedBy: uuid('submitted_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    visibility: evalVisibilityEnum('visibility').default('public').notNull(),
    verified: boolean('verified').default(false).notNull(),
    tags: jsonb('tags').$type<string[]>(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('harnesses_slug_idx').on(table.slug),
    index('harnesses_kind_idx').on(table.kind),
    index('harnesses_submitted_by_idx').on(table.submittedBy),
    index('harnesses_visibility_idx').on(table.visibility),
    index('harnesses_deleted_at_idx').on(table.deletedAt),
  ],
);

// A pinned, immutable version of a harness: git SHA + image digest + manifest
// hash form the three-layer reproducibility pin.
export const harnessVersions = pgTable(
  'harness_versions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    harnessId: uuid('harness_id')
      .references(() => harnesses.id, { onDelete: 'cascade' })
      .notNull(),
    version: text('version').notNull(),
    gitSha: text('git_sha'),
    imageDigest: text('image_digest'),
    manifestRef: text('manifest_ref'),
    manifest: jsonb('manifest').$type<HarnessManifestJson>(),
    manifestHash: text('manifest_hash'),
    notes: text('notes'),
    isCurrent: boolean('is_current').default(false).notNull(),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('harness_versions_harness_id_idx').on(table.harnessId),
    index('harness_versions_is_current_idx').on(table.isCurrent),
    unique('harness_versions_harness_version_unique').on(table.harnessId, table.version),
    // TODO(epic-1 follow-up story): add a PARTIAL unique index enforcing one
    // is_current=true row per harnessId. Hand-written in a later migration.
  ],
);

// ---------------------------------------------------------------------------
// Models (soft link to model-depot)
// ---------------------------------------------------------------------------

// A model usable as an eval backend. Mirrors a model-depot card by a SOFT text
// id (depotModelId) — no hard FK — and snapshots pricing at registration time.
export const models = pgTable(
  'models',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    depotModelId: text('depot_model_id').notNull(),
    providerId: text('provider_id').notNull(),
    displayName: text('display_name'),
    organization: text('organization'),
    contextWindowTokens: integer('context_window_tokens'),
    inputPricePerMtok: real('input_price_per_mtok'),
    outputPricePerMtok: real('output_price_per_mtok'),
    cachedInputPricePerMtok: real('cached_input_price_per_mtok'),
    priceCurrency: text('price_currency'),
    abilities: jsonb('abilities').$type<ModelAbilitiesJson>(),
    active: boolean('active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('models_depot_model_id_idx').on(table.depotModelId),
    index('models_provider_id_idx').on(table.providerId),
    index('models_active_idx').on(table.active),
    unique('models_depot_provider_unique').on(table.depotModelId, table.providerId),
  ],
);

// ---------------------------------------------------------------------------
// Benchmark tasks & suites
// ---------------------------------------------------------------------------

// A single held-out benchmark task. Prompt/fixture/grader content lives behind
// storage refs — never inline — so held-out answers stay out of queryable rows.
export const benchmarkTasks = pgTable(
  'benchmark_tasks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    kind: taskKindEnum('kind').notNull(),
    promptRef: text('prompt_ref'),
    fixtureRef: text('fixture_ref'),
    graderKind: graderKindEnum('grader_kind').notNull(),
    graderConfig: jsonb('grader_config').$type<GraderConfigJson>(),
    maxScore: real('max_score'),
    timeoutSeconds: integer('timeout_seconds'),
    heldOut: boolean('held_out').default(true).notNull(),
    contentHash: text('content_hash'),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('benchmark_tasks_slug_idx').on(table.slug),
    index('benchmark_tasks_kind_idx').on(table.kind),
    index('benchmark_tasks_grader_kind_idx').on(table.graderKind),
    index('benchmark_tasks_held_out_idx').on(table.heldOut),
    index('benchmark_tasks_deleted_at_idx').on(table.deletedAt),
  ],
);

// A versioned collection of benchmark tasks. Rotation metadata supports
// static / rotating / canary suites; supersededById chains revisions.
export const taskSuites = pgTable(
  'task_suites',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull().unique(),
    name: text('name').notNull(),
    description: text('description'),
    rotation: suiteRotationEnum('rotation').default('static').notNull(),
    rotationPeriodDays: integer('rotation_period_days'),
    rotationSeed: text('rotation_seed'),
    activeFrom: timestamp('active_from', { withTimezone: true }),
    activeUntil: timestamp('active_until', { withTimezone: true }),
    supersededById: uuid('superseded_by_id').references((): PgColumn => taskSuites.id, {
      onDelete: 'set null',
    }),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('task_suites_slug_idx').on(table.slug),
    index('task_suites_rotation_idx').on(table.rotation),
    index('task_suites_superseded_by_id_idx').on(table.supersededById),
    index('task_suites_is_active_idx').on(table.isActive),
  ],
);

// Join table: which tasks belong to a suite, with weight + ordering.
export const taskSuiteTasks = pgTable(
  'task_suite_tasks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    suiteId: uuid('suite_id')
      .references(() => taskSuites.id, { onDelete: 'cascade' })
      .notNull(),
    taskId: uuid('task_id')
      .references(() => benchmarkTasks.id, { onDelete: 'cascade' })
      .notNull(),
    weight: real('weight').default(1).notNull(),
    position: integer('position').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('task_suite_tasks_suite_id_idx').on(table.suiteId),
    index('task_suite_tasks_task_id_idx').on(table.taskId),
    unique('task_suite_tasks_suite_task_unique').on(table.suiteId, table.taskId),
  ],
);

// ---------------------------------------------------------------------------
// Eval runs & results
// ---------------------------------------------------------------------------

// One execution of (harness_version x model x suite). Carries the status
// machine plus cost/token/latency rollups. The (harnessVersionId, modelId,
// suiteId) index is the leaderboard-cell lookup.
export const evalRuns = pgTable(
  'eval_runs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    harnessVersionId: uuid('harness_version_id')
      .references(() => harnessVersions.id, { onDelete: 'restrict' })
      .notNull(),
    modelId: uuid('model_id')
      .references(() => models.id, { onDelete: 'restrict' })
      .notNull(),
    suiteId: uuid('suite_id')
      .references(() => taskSuites.id, { onDelete: 'restrict' })
      .notNull(),
    triggeredBy: uuid('triggered_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    backend: modelBackendEnum('backend').default('platform').notNull(),
    // BYO path only: points at the reused apiKeys row. Null for platform runs.
    apiKeyId: uuid('api_key_id').references(() => apiKeys.id, {
      onDelete: 'set null',
    }),
    visibility: evalVisibilityEnum('visibility').default('public').notNull(),
    status: evalRunStatusEnum('status').default('queued').notNull(),
    error: text('error'),
    runnerImageDigest: text('runner_image_digest'),
    suiteSnapshotHash: text('suite_snapshot_hash'),
    seed: integer('seed'),
    // Rollups
    tasksTotal: integer('tasks_total'),
    tasksCompleted: integer('tasks_completed'),
    promptTokens: integer('prompt_tokens'),
    completionTokens: integer('completion_tokens'),
    totalTokens: integer('total_tokens'),
    costUsd: real('cost_usd'),
    latencyMsP50: integer('latency_ms_p50'),
    latencyMsP95: integer('latency_ms_p95'),
    wallClockMs: integer('wall_clock_ms'),
    queuedAt: timestamp('queued_at', { withTimezone: true }),
    startedAt: timestamp('started_at', { withTimezone: true }),
    finishedAt: timestamp('finished_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // Leaderboard cell lookup.
    index('eval_runs_cell_idx').on(table.harnessVersionId, table.modelId, table.suiteId),
    index('eval_runs_harness_version_id_idx').on(table.harnessVersionId),
    index('eval_runs_model_id_idx').on(table.modelId),
    index('eval_runs_suite_id_idx').on(table.suiteId),
    index('eval_runs_triggered_by_idx').on(table.triggeredBy),
    index('eval_runs_api_key_id_idx').on(table.apiKeyId),
    index('eval_runs_status_idx').on(table.status),
  ],
);

// Per-task outcome within a run. Multiple attempts allowed (pass@k); each
// attempt is a distinct row keyed by (runId, taskId, attempt).
export const runResults = pgTable(
  'run_results',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    runId: uuid('run_id')
      .references(() => evalRuns.id, { onDelete: 'cascade' })
      .notNull(),
    taskId: uuid('task_id')
      .references(() => benchmarkTasks.id, { onDelete: 'restrict' })
      .notNull(),
    status: runResultStatusEnum('status').default('pending').notNull(),
    rawScore: real('raw_score'),
    normalizedScore: real('normalized_score'),
    traceRef: text('trace_ref'),
    artifactRef: text('artifact_ref'),
    promptTokens: integer('prompt_tokens'),
    completionTokens: integer('completion_tokens'),
    costUsd: real('cost_usd'),
    latencyMs: integer('latency_ms'),
    attempt: integer('attempt').default(1).notNull(),
    graderOutput: jsonb('grader_output').$type<GraderOutputJson>(),
    startedAt: timestamp('started_at', { withTimezone: true }),
    finishedAt: timestamp('finished_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('run_results_run_id_idx').on(table.runId),
    index('run_results_task_id_idx').on(table.taskId),
    index('run_results_status_idx').on(table.status),
    unique('run_results_run_task_attempt_unique').on(table.runId, table.taskId, table.attempt),
  ],
);

// A single step in a run-result transcript (the trace): role, tool call,
// summary. Bulk content stays behind contentRef.
export const runSteps = pgTable(
  'run_steps',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    runResultId: uuid('run_result_id')
      .references(() => runResults.id, { onDelete: 'cascade' })
      .notNull(),
    stepIndex: integer('step_index').notNull(),
    role: text('role'),
    toolName: text('tool_name'),
    summary: text('summary'),
    contentRef: text('content_ref'),
    tokens: integer('tokens'),
    latencyMs: integer('latency_ms'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('run_steps_run_result_id_idx').on(table.runResultId),
    unique('run_steps_run_result_step_unique').on(table.runResultId, table.stepIndex),
  ],
);

// Per-metric aggregate score for a run (e.g. pass@1, with stderr + sample size).
export const scores = pgTable(
  'scores',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    runId: uuid('run_id')
      .references(() => evalRuns.id, { onDelete: 'cascade' })
      .notNull(),
    metric: text('metric').notNull(),
    value: real('value'),
    stderr: real('stderr'),
    sampleSize: integer('sample_size'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('scores_run_id_idx').on(table.runId),
    unique('scores_run_metric_unique').on(table.runId, table.metric),
  ],
);

// ---------------------------------------------------------------------------
// Leaderboard (materialized cell aggregate)
// ---------------------------------------------------------------------------

// Upsertable materialized aggregate for one (harness x model x suite) cell:
// score band + Pareto/frontier fields + reserved arenaElo for future
// human-arena signal. Recomputed incrementally per cell.
export const leaderboardEntries = pgTable(
  'leaderboard_entries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    harnessId: uuid('harness_id')
      .references(() => harnesses.id, { onDelete: 'cascade' })
      .notNull(),
    harnessVersionId: uuid('harness_version_id').references(() => harnessVersions.id, {
      onDelete: 'set null',
    }),
    modelId: uuid('model_id')
      .references(() => models.id, { onDelete: 'cascade' })
      .notNull(),
    suiteId: uuid('suite_id')
      .references(() => taskSuites.id, { onDelete: 'cascade' })
      .notNull(),
    score: real('score'),
    scoreStderr: real('score_stderr'),
    rank: integer('rank'),
    avgCostUsd: real('avg_cost_usd'),
    costPerSolvedTask: real('cost_per_solved_task'),
    avgLatencyMs: integer('avg_latency_ms'),
    avgTotalTokens: integer('avg_total_tokens'),
    paretoOptimal: boolean('pareto_optimal').default(false).notNull(),
    runCount: integer('run_count').default(0).notNull(),
    sampleSize: integer('sample_size'),
    // Reserved for future human-arena signal (Bradley-Terry). Nullable.
    arenaElo: real('arena_elo'),
    lastRunAt: timestamp('last_run_at', { withTimezone: true }),
    computedAt: timestamp('computed_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('leaderboard_entries_harness_id_idx').on(table.harnessId),
    index('leaderboard_entries_harness_version_id_idx').on(table.harnessVersionId),
    index('leaderboard_entries_model_id_idx').on(table.modelId),
    index('leaderboard_entries_suite_id_idx').on(table.suiteId),
    index('leaderboard_entries_suite_score_idx').on(table.suiteId, table.score),
    unique('leaderboard_entries_harness_model_suite_unique').on(
      table.harnessId,
      table.modelId,
      table.suiteId,
    ),
  ],
);

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------

export const harnessesRelations = relations(harnesses, ({ one, many }) => ({
  submitter: one(users, {
    fields: [harnesses.submittedBy],
    references: [users.id],
  }),
  versions: many(harnessVersions),
  leaderboardEntries: many(leaderboardEntries),
}));

export const harnessVersionsRelations = relations(harnessVersions, ({ one, many }) => ({
  harness: one(harnesses, {
    fields: [harnessVersions.harnessId],
    references: [harnesses.id],
  }),
  evalRuns: many(evalRuns),
  leaderboardEntries: many(leaderboardEntries),
}));

export const modelsRelations = relations(models, ({ many }) => ({
  evalRuns: many(evalRuns),
  leaderboardEntries: many(leaderboardEntries),
}));

export const benchmarkTasksRelations = relations(benchmarkTasks, ({ many }) => ({
  suiteTasks: many(taskSuiteTasks),
  runResults: many(runResults),
}));

export const taskSuitesRelations = relations(taskSuites, ({ one, many }) => ({
  supersededBy: one(taskSuites, {
    fields: [taskSuites.supersededById],
    references: [taskSuites.id],
    relationName: 'suite_supersession',
  }),
  supersedes: many(taskSuites, {
    relationName: 'suite_supersession',
  }),
  suiteTasks: many(taskSuiteTasks),
  evalRuns: many(evalRuns),
  leaderboardEntries: many(leaderboardEntries),
}));

export const taskSuiteTasksRelations = relations(taskSuiteTasks, ({ one }) => ({
  suite: one(taskSuites, {
    fields: [taskSuiteTasks.suiteId],
    references: [taskSuites.id],
  }),
  task: one(benchmarkTasks, {
    fields: [taskSuiteTasks.taskId],
    references: [benchmarkTasks.id],
  }),
}));

export const evalRunsRelations = relations(evalRuns, ({ one, many }) => ({
  harnessVersion: one(harnessVersions, {
    fields: [evalRuns.harnessVersionId],
    references: [harnessVersions.id],
  }),
  model: one(models, {
    fields: [evalRuns.modelId],
    references: [models.id],
  }),
  suite: one(taskSuites, {
    fields: [evalRuns.suiteId],
    references: [taskSuites.id],
  }),
  triggeredByUser: one(users, {
    fields: [evalRuns.triggeredBy],
    references: [users.id],
  }),
  apiKey: one(apiKeys, {
    fields: [evalRuns.apiKeyId],
    references: [apiKeys.id],
  }),
  results: many(runResults),
  scores: many(scores),
}));

export const runResultsRelations = relations(runResults, ({ one, many }) => ({
  run: one(evalRuns, {
    fields: [runResults.runId],
    references: [evalRuns.id],
  }),
  task: one(benchmarkTasks, {
    fields: [runResults.taskId],
    references: [benchmarkTasks.id],
  }),
  steps: many(runSteps),
}));

export const runStepsRelations = relations(runSteps, ({ one }) => ({
  runResult: one(runResults, {
    fields: [runSteps.runResultId],
    references: [runResults.id],
  }),
}));

export const scoresRelations = relations(scores, ({ one }) => ({
  run: one(evalRuns, {
    fields: [scores.runId],
    references: [evalRuns.id],
  }),
}));

export const leaderboardEntriesRelations = relations(leaderboardEntries, ({ one }) => ({
  harness: one(harnesses, {
    fields: [leaderboardEntries.harnessId],
    references: [harnesses.id],
  }),
  harnessVersion: one(harnessVersions, {
    fields: [leaderboardEntries.harnessVersionId],
    references: [harnessVersions.id],
  }),
  model: one(models, {
    fields: [leaderboardEntries.modelId],
    references: [models.id],
  }),
  suite: one(taskSuites, {
    fields: [leaderboardEntries.suiteId],
    references: [taskSuites.id],
  }),
}));

// ---------------------------------------------------------------------------
// Type exports
// ---------------------------------------------------------------------------

export type Harness = typeof harnesses.$inferSelect;
export type NewHarness = typeof harnesses.$inferInsert;
export type HarnessVersion = typeof harnessVersions.$inferSelect;
export type NewHarnessVersion = typeof harnessVersions.$inferInsert;
export type Model = typeof models.$inferSelect;
export type NewModel = typeof models.$inferInsert;
export type BenchmarkTask = typeof benchmarkTasks.$inferSelect;
export type NewBenchmarkTask = typeof benchmarkTasks.$inferInsert;
export type TaskSuite = typeof taskSuites.$inferSelect;
export type NewTaskSuite = typeof taskSuites.$inferInsert;
export type TaskSuiteTask = typeof taskSuiteTasks.$inferSelect;
export type NewTaskSuiteTask = typeof taskSuiteTasks.$inferInsert;
export type EvalRun = typeof evalRuns.$inferSelect;
export type NewEvalRun = typeof evalRuns.$inferInsert;
export type RunResult = typeof runResults.$inferSelect;
export type NewRunResult = typeof runResults.$inferInsert;
export type RunStep = typeof runSteps.$inferSelect;
export type NewRunStep = typeof runSteps.$inferInsert;
export type Score = typeof scores.$inferSelect;
export type NewScore = typeof scores.$inferInsert;
export type LeaderboardEntry = typeof leaderboardEntries.$inferSelect;
export type NewLeaderboardEntry = typeof leaderboardEntries.$inferInsert;

// Enum types
export type HarnessKind = (typeof harnessKindEnum.enumValues)[number];
export type ModelBackend = (typeof modelBackendEnum.enumValues)[number];
export type SuiteRotation = (typeof suiteRotationEnum.enumValues)[number];
export type TaskKind = (typeof taskKindEnum.enumValues)[number];
export type GraderKind = (typeof graderKindEnum.enumValues)[number];
export type EvalRunStatus = (typeof evalRunStatusEnum.enumValues)[number];
export type RunResultStatus = (typeof runResultStatusEnum.enumValues)[number];
export type EvalVisibility = (typeof evalVisibilityEnum.enumValues)[number];
