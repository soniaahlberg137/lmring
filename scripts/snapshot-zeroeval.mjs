#!/usr/bin/env node
/**
 * One-time snapshot of ZeroEval's current data.
 *
 * Captures three data sources exactly as ZeroEval returns them:
 *   1. /leaderboard/models/full  — canonical LLM base models + their benchmark scores
 *   2. /magia/models/scores      — per-model arena scores for LLM arenas
 *   3. /magia/arenas/{arena}/leaderboard — non-LLM arena leaderboards
 *
 * Output: scripts/zeroeval-snapshot.json
 *
 * Run: node scripts/snapshot-zeroeval.mjs
 */

import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = 'https://api.zeroeval.com';

const LLM_ARENA_NAMES = [
  'chat-arena',
  'text-to-website',
  'threejs',
  'text-to-game',
  'p5-animation',
  'text-to-svg',
  'dataviz',
  'tonejs',
];

const NON_LLM_ARENAS = [
  'text-to-image',
  'image-to-image',
  'text-to-video',
  'image-to-video',
  'video-editing',
  'text-to-speech',
  'speech-to-text',
];

// ─────────────────────────────────────────────────────────────────────────────

async function fetchJson(url) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}\n  ${url}`);
  return res.json();
}

// Arena scores: batch 100 model IDs per request to stay under URL length limits.
async function fetchArenaScores(modelIds) {
  const BATCH = 100;
  const arenaParam = LLM_ARENA_NAMES.join(',');
  const result = {};
  const batches = Math.ceil(modelIds.length / BATCH);

  for (let i = 0; i < modelIds.length; i += BATCH) {
    const slice = modelIds.slice(i, i + BATCH);
    const params = new URLSearchParams({ model_ids: slice.join(','), arena_names: arenaParam });
    console.log(`    batch ${Math.floor(i / BATCH) + 1}/${batches} (${slice.length} models)...`);
    const data = await fetchJson(`${BASE}/magia/models/scores?${params}`);
    Object.assign(result, data);
  }

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────

function hr() {
  console.log('─'.repeat(64));
}

/** Print each key → typeof + truncated sample value for one record. */
function printFields(record, header) {
  console.log(`\n  ${header}`);
  for (const [k, v] of Object.entries(record)) {
    const type = v === null ? 'null   ' : `${typeof v}`.padEnd(7);
    const sample = v === null ? '' : JSON.stringify(v).slice(0, 50);
    console.log(`    ${k.padEnd(34)} ${type}  ${sample}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\nZeroEval snapshot — starting\n');
  const capturedAt = new Date().toISOString();

  // 1. Base models ────────────────────────────────────────────────────────────
  hr();
  console.log('1/3  GET /leaderboard/models/full?justCanonicals=true');
  hr();
  const modelsFull = await fetchJson(`${BASE}/leaderboard/models/full?justCanonicals=true`);

  if (!Array.isArray(modelsFull)) {
    throw new Error(`Unexpected response shape: ${JSON.stringify(modelsFull).slice(0, 200)}`);
  }
  console.log(`  ✓  ${modelsFull.length} models returned\n`);
  printFields(modelsFull[0], `Fields in record[0]  (model_id: ${modelsFull[0].model_id})`);

  // 2. Arena scores ───────────────────────────────────────────────────────────
  hr();
  console.log('2/3  GET /magia/models/scores  (LLM arenas)');
  hr();
  const modelIds = modelsFull.map((m) => m.model_id);
  const arenaScores = await fetchArenaScores(modelIds);
  const arenaEntries = Object.entries(arenaScores);
  console.log(`  ✓  ${arenaEntries.length} models have arena scores`);

  const firstArena = arenaEntries[0];
  if (firstArena) {
    console.log(`\n  Sample (${firstArena[0]}):`);
    for (const [arena, score] of Object.entries(firstArena[1])) {
      console.log(`    ${arena.padEnd(22)}  ${score}`);
    }
  }

  const modelsWithNoArenaScores = modelIds.filter((id) => !arenaScores[id]);
  if (modelsWithNoArenaScores.length > 0) {
    console.log(
      `\n  Note: ${modelsWithNoArenaScores.length} models have no arena scores at all`,
    );
  }

  // 3. Non-LLM arena leaderboards ─────────────────────────────────────────────
  hr();
  console.log('3/3  GET /magia/arenas/{arena}/leaderboard  (non-LLM arenas)');
  hr();
  const magiaLeaderboards = {};
  for (const arena of NON_LLM_ARENAS) {
    const params = new URLSearchParams({ limit: '200', offset: '0' });
    process.stdout.write(`  ${arena.padEnd(22)}...  `);
    const data = await fetchJson(
      `${BASE}/magia/arenas/${encodeURIComponent(arena)}/leaderboard?${params}`,
    );
    magiaLeaderboards[arena] = data;
    console.log(`✓  ${data.leaderboard?.length ?? 0} entries`);
  }

  // Print fields for the first non-empty leaderboard
  const firstNonEmpty = Object.entries(magiaLeaderboards).find(
    ([, lb]) => lb.leaderboard?.length > 0,
  );
  if (firstNonEmpty) {
    const [arenaName, lb] = firstNonEmpty;
    printFields(lb.leaderboard[0], `Fields in first magia record  (arena: ${arenaName})`);
  }

  // ── Save ────────────────────────────────────────────────────────────────────
  hr();
  const snapshot = { captured_at: capturedAt, models_full: modelsFull, arena_scores: arenaScores, magia_leaderboards: magiaLeaderboards };
  const outPath = join(__dirname, 'zeroeval-snapshot.json');
  writeFileSync(outPath, JSON.stringify(snapshot, null, 2));
  const kb = Math.round(Buffer.byteLength(JSON.stringify(snapshot)) / 1024);
  console.log(`\nSaved → scripts/zeroeval-snapshot.json  (${kb} KB)\n`);

  // ── Summary ─────────────────────────────────────────────────────────────────
  hr();
  console.log('Summary');
  hr();
  console.log(`  models_full           ${modelsFull.length} records`);
  console.log(`  arena_scores          ${arenaEntries.length} models covered`);
  for (const [arena, lb] of Object.entries(magiaLeaderboards)) {
    console.log(`  magia/${arena.padEnd(22)} ${lb.leaderboard?.length ?? 0} entries`);
  }
  console.log('');
}

main().catch((err) => {
  console.error('\n✗ Fatal:', err.message);
  process.exit(1);
});
