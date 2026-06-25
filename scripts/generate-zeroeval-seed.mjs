#!/usr/bin/env node
/**
 * Generates packages/database/seeds/zeroeval-snapshot.sql from the existing
 * scripts/zeroeval-snapshot.json produced by snapshot-zeroeval.mjs.
 *
 * No network calls — reads only from the local snapshot file.
 *
 * Run: node scripts/generate-zeroeval-seed.mjs
 * Apply: psql $DATABASE_URL -f packages/database/seeds/zeroeval-snapshot.sql
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ─────────────────────────────────────────────────────────────────────────────
// SQL helpers
// ─────────────────────────────────────────────────────────────────────────────

function sqlVal(v) {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
  if (typeof v === 'number') return String(v);
  // Objects (jsonb columns): serialise to JSON string; Postgres coerces automatically
  if (typeof v === 'object') return `'${JSON.stringify(v).replace(/'/g, "''")}'`;
  // Strings (including date strings stored as text, and timestamptz literals)
  return `'${String(v).replace(/'/g, "''")}'`;
}

function row(values) {
  return `  (${values.join(', ')})`;
}

/**
 * Emit a multi-value INSERT split into batches.
 * Keeps individual statements at a manageable size and makes psql error output
 * easier to trace back to a specific row range.
 */
function insertBatched(table, columns, rowArrays, conflictClause, batchSize = 100) {
  const colList = columns.join(', ');
  const chunks = [];
  for (let i = 0; i < rowArrays.length; i += batchSize) {
    const batch = rowArrays.slice(i, i + batchSize);
    chunks.push(
      `INSERT INTO ${table} (${colList})\nVALUES\n${batch.map(row).join(',\n')}\n${conflictClause};`,
    );
  }
  return chunks.join('\n\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// Column definitions (must match schema.ts exactly)
// ─────────────────────────────────────────────────────────────────────────────

const BASE_MODEL_COLS = [
  // Identity
  'model_id', 'name', 'organization', 'organization_id', 'organization_country',
  // Specs
  'params', 'training_tokens', 'context', 'canonical_model_id', 'is_moe', 'multimodal',
  // Dates & meta
  'release_date', 'announcement_date', 'license', 'knowledge_cutoff',
  // Pricing / performance
  'input_price', 'output_price', 'throughput', 'latency',
  // Benchmark scores (22 real ZeroEval fields)
  'aime_2025_score', 'hle_score', 'gpqa_score', 'swe_bench_verified_score', 'mmmu_score',
  'simpleqa_score', 'osworld_score', 'browsecomp_score', 'toolathlon_score', 'terminal_bench_score',
  'tau_bench_retail_score', 'arc_agi_v2_score', 'mmmlu_score', 'charxiv_r_score', 'mmmu_pro_score',
  'screenspot_pro_score', 'mcp_atlas_score', 'frontiermath_score', 'mrcr_v2_score', 'scicode_score',
  'apex_agents_score', 'swe_bench_pro_score',
  // LLM arena scores (raw — see SCALE WARNING in schema.ts)
  'chat_arena_score', 'text_to_website_score', 'threejs_score', 'text_to_game_score',
  'p5_animation_score', 'text_to_svg_score', 'dataviz_score', 'tonejs_score',
  // Snapshot metadata
  'snapshotted_at',
];

// id is omitted — DEFAULT gen_random_uuid() handles it
const ARENA_ENTRY_COLS = [
  'arena',
  // ZeroEval identifiers
  'variant_id', 'variant_key', 'variant_metadata',
  'model_id', 'model_name', 'organization', 'license', 'is_open_source', 'announcement_date',
  // Ratings
  'mu', 'sigma', 'conservative_rating', 'rating_change_7d',
  // Match stats
  'matches_played', 'wins', 'win_rate',
  // Pricing / performance
  'input_price', 'output_price', 'avg_generation_price', 'priced_generations',
  'throughput_cps', 'avg_ttfb',
  // ZeroEval's own timestamps (stored as text)
  'zeval_created_at', 'zeval_updated_at',
  // Snapshot metadata
  'snapshotted_at',
];

// ─────────────────────────────────────────────────────────────────────────────
// Row builders
// ─────────────────────────────────────────────────────────────────────────────

function buildBaseModelRow(model, arenaScores, capturedAt) {
  const a = arenaScores[model.model_id] ?? {};
  return [
    model.model_id,
    model.name,
    model.organization,
    model.organization_id,
    model.organization_country ?? null,
    model.params ?? null,
    model.training_tokens ?? null,
    model.context ?? null,
    model.canonical_model_id ?? null,
    model.is_moe ?? null,
    model.multimodal ?? false,
    model.release_date ?? null,
    model.announcement_date,
    model.license,
    model.knowledge_cutoff ?? null,
    model.input_price ?? null,
    model.output_price ?? null,
    model.throughput ?? null,
    model.latency ?? null,
    model.aime_2025_score ?? null,
    model.hle_score ?? null,
    model.gpqa_score ?? null,
    model.swe_bench_verified_score ?? null,
    model.mmmu_score ?? null,
    model.simpleqa_score ?? null,
    model.osworld_score ?? null,
    model.browsecomp_score ?? null,
    model.toolathlon_score ?? null,
    model.terminal_bench_score ?? null,
    model.tau_bench_retail_score ?? null,
    model.arc_agi_v2_score ?? null,
    model.mmmlu_score ?? null,
    model.charxiv_r_score ?? null,
    model.mmmu_pro_score ?? null,
    model.screenspot_pro_score ?? null,
    model.mcp_atlas_score ?? null,
    model.frontiermath_score ?? null,
    model.mrcr_v2_score ?? null,
    model.scicode_score ?? null,
    model.apex_agents_score ?? null,
    model.swe_bench_pro_score ?? null,
    a['chat-arena'] ?? null,
    a['text-to-website'] ?? null,
    a['threejs'] ?? null,
    a['text-to-game'] ?? null,
    a['p5-animation'] ?? null,
    a['text-to-svg'] ?? null,
    a['dataviz'] ?? null,
    a['tonejs'] ?? null,
    capturedAt,
  ].map(sqlVal);
}

function buildArenaEntryRow(arenaName, item, capturedAt) {
  return [
    arenaName,
    item.variant_id,
    item.variant_key,
    item.variant_metadata ?? null,
    item.model_id,
    item.model_name,
    item.organization,
    item.license,
    item.is_open_source ?? false,
    item.announcement_date,
    item.mu,
    item.sigma,
    item.conservative_rating,
    item.rating_change_7d ?? null,
    item.matches_played,
    item.wins,
    item.win_rate,
    item.input_price ?? null,
    item.output_price ?? null,
    item.avg_generation_price ?? null,
    item.priced_generations ?? null,
    item.throughput_cps ?? null,
    item.avg_ttfb ?? null,
    item.created_at ?? null,
    item.updated_at ?? null,
    capturedAt,
  ].map(sqlVal);
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

const snapshotPath = join(__dirname, 'zeroeval-snapshot.json');
console.log(`Reading ${snapshotPath}`);
const snapshot = JSON.parse(readFileSync(snapshotPath, 'utf-8'));

const { captured_at, models_full, arena_scores, magia_leaderboards } = snapshot;
console.log(`  captured_at : ${captured_at}`);
console.log(`  models_full : ${models_full.length} rows`);
console.log(`  arena_scores: ${Object.keys(arena_scores).length} models`);

// ── Build base model rows ────────────────────────────────────────────────────
const baseModelRows = models_full.map((m) => buildBaseModelRow(m, arena_scores, captured_at));

// ── Build arena entry rows ───────────────────────────────────────────────────
const arenaEntryRows = [];
let totalArenaEntries = 0;
for (const [arenaName, lb] of Object.entries(magia_leaderboards)) {
  const entries = lb.leaderboard ?? [];
  for (const item of entries) {
    arenaEntryRows.push(buildArenaEntryRow(arenaName, item, captured_at));
  }
  totalArenaEntries += entries.length;
  console.log(`  magia/${arenaName.padEnd(22)} ${entries.length} entries`);
}

// ── Assemble SQL ─────────────────────────────────────────────────────────────
const sql = `-- ZeroEval snapshot seed — captured ${captured_at}
-- Generated by scripts/generate-zeroeval-seed.mjs
-- Apply: psql $DATABASE_URL -f packages/database/seeds/zeroeval-snapshot.sql
--
-- zeval_base_models : ${baseModelRows.length} rows
-- zeval_arena_entries: ${arenaEntryRows.length} rows
--
-- Idempotent: ON CONFLICT DO NOTHING — safe to re-run.

${insertBatched(
  'zeval_base_models',
  BASE_MODEL_COLS,
  baseModelRows,
  'ON CONFLICT (model_id) DO NOTHING',
)}

${insertBatched(
  'zeval_arena_entries',
  ARENA_ENTRY_COLS,
  arenaEntryRows,
  'ON CONFLICT (arena, variant_id) DO NOTHING',
)}
`;

// ── Write output ─────────────────────────────────────────────────────────────
const outDir = join(ROOT, 'packages', 'database', 'seeds');
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, 'zeroeval-snapshot.sql');
writeFileSync(outPath, sql);

const kb = Math.round(Buffer.byteLength(sql) / 1024);
console.log(`\nWritten → packages/database/seeds/zeroeval-snapshot.sql  (${kb} KB)`);
console.log(`  zeval_base_models : ${baseModelRows.length} rows`);
console.log(`  zeval_arena_entries: ${arenaEntryRows.length} rows`);
console.log('\nApply with:');
console.log('  psql $DATABASE_URL -f packages/database/seeds/zeroeval-snapshot.sql');
