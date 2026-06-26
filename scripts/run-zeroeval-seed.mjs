#!/usr/bin/env node
/**
 * Applies packages/database/seeds/zeroeval-snapshot.sql to the database.
 * Uses the postgres package already installed in @lmring/database.
 *
 * Run: node --env-file=.env scripts/run-zeroeval-seed.mjs
 */

import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL is not set. Run with: node --env-file=.env scripts/run-zeroeval-seed.mjs');
  process.exit(1);
}

// Use postgres package from @lmring/database's node_modules
const postgres = require('../packages/database/node_modules/postgres');

const sqlPath = join(__dirname, '..', 'packages', 'database', 'seeds', 'zeroeval-snapshot.sql');
const sql = readFileSync(sqlPath, 'utf-8');

console.log('Connecting to database...');
const db = postgres(DATABASE_URL, { max: 1 });

try {
  console.log('Applying seed...');
  await db.unsafe(sql);
  console.log('✓  Seed applied successfully');

  // Verify row counts
  const [baseCount] = await db`SELECT count(*)::int AS n FROM zeval_base_models`;
  const [arenaCount] = await db`SELECT count(*)::int AS n FROM zeval_arena_entries`;
  console.log(`\n  zeval_base_models  : ${baseCount.n} rows`);
  console.log(`  zeval_arena_entries: ${arenaCount.n} rows`);
} finally {
  await db.end();
}
