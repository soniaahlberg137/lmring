import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  // Monorepo workspace configuration. Plugins (Next.js, Vitest, Playwright,
  // Drizzle, Checkly, etc.) auto-detect their own config files, so we only
  // declare entries that the plugins miss.
  workspaces: {
    '.': {},

    'apps/web': {
      // Next.js plugin auto-detects proxy.ts, instrumentation*.ts, postcss
      // config, etc. We only add what the plugin doesn't cover:
      // - Playwright/Checkly e2e specs under tests/**
      // - checkly.config.ts (consumed by the Checkly CLI)
      // - global stylesheets that pull in CSS-only deps via @import / @plugin
      entry: [
        'tests/**/*.{ts,tsx}',
        'checkly.config.ts',
        'src/styles/**/*.css',
      ],
      // Use negated `project` patterns instead of `ignore` to define
      // codebase boundaries (per knip's official guidance).
      project: [
        'src/**/*.{ts,tsx}',
        '!src/__mocks__/**',
        '!src/test/**',
        '!src/**/*.test.{ts,tsx}',
      ],
      // Real consumers exist outside files knip scans:
      // - @lmring/biome-config: extended from apps/web/biome.json
      // - vitest-browser-react: loaded by Vitest plugin via vitest config
      ignoreDependencies: ['@lmring/biome-config', 'vitest-browser-react'],
    },

    'packages/ai-hub': {
      entry: ['src/index.{ts,tsx}', 'src/**/index.{ts,tsx}'],
      project: ['src/**/*.{ts,tsx}', '!src/**/*.test.{ts,tsx}'],
    },

    'packages/auth': {
      entry: ['src/index.{ts,tsx}', 'src/**/index.{ts,tsx}'],
      project: ['src/**/*.{ts,tsx}', '!src/**/*.test.{ts,tsx}'],
    },

    'packages/database': {
      project: ['src/**/*.ts', '!migrations/**', '!src/**/*.test.ts'],
    },

    'packages/env': {
      entry: ['src/index.{ts,tsx}', 'src/**/index.{ts,tsx}'],
      project: ['src/**/*.{ts,tsx}', '!src/**/*.test.{ts,tsx}'],
    },

    'packages/i18n': {
      entry: ['src/index.{ts,tsx}', 'src/**/index.{ts,tsx}'],
      project: ['src/**/*.{ts,tsx}', '!src/**/*.test.{ts,tsx}'],
    },

    'packages/model-depot': {
      entry: ['src/index.{ts,tsx}', 'src/**/index.{ts,tsx}'],
      project: ['src/**/*.{ts,tsx}', '!src/**/*.test.{ts,tsx}'],
    },

    'packages/storage': {
      entry: ['src/index.{ts,tsx}', 'src/**/index.{ts,tsx}'],
      project: ['src/**/*.{ts,tsx}', '!src/**/*.test.{ts,tsx}'],
    },

    'packages/theme': {
      entry: ['src/index.{ts,tsx}', 'src/**/index.{ts,tsx}'],
      project: ['src/**/*.{ts,tsx}', '!src/**/*.test.{ts,tsx}'],
    },

    'packages/ui': {
      // Re-exports happen via per-component index files, plus the per-component
      // `types.ts` re-export shim that backs the `typesVersions` subpath imports
      // declared in package.json (e.g. `@lmring/ui/button`).
      entry: [
        'src/index.{ts,tsx}',
        'src/components/**/index.{ts,tsx}',
        'src/components/**/types.ts',
      ],
      project: ['src/**/*.{ts,tsx}', '!src/**/*.test.{ts,tsx}'],
    },

    'packages/video-runtime': {
      entry: ['src/index.{ts,tsx}', 'src/**/index.{ts,tsx}'],
      project: ['src/**/*.{ts,tsx}', '!src/**/*.test.{ts,tsx}'],
    },

    'packages/config/typescript-config': {
      // `next` is referenced from nextjs.json but only installed in apps/web.
      ignoreDependencies: ['next'],
    },

    'packages/config/biome-config': {
      // biome.json is the only artifact; no JS/TS to scan.
      entry: ['biome.json'],
    },

    'packages/config/tailwind-config': {
      // PostCSS plugin auto-detects postcss.config.js, and the CSS plugin
      // auto-detects shared-styles.css.
    },

    'packages/config/vitest-config': {
      // Vitest plugin auto-detects base.mts/react.mts via package.json exports.
    },
  },

  // Internal-only exports are common in this codebase (compound components,
  // local helpers). Keep type/interface checks strict so we still catch dead
  // type definitions like the unused validation input types.
  ignoreExportsUsedInFile: {
    interface: true,
    type: true,
  },

  // CSS @import / @plugin resolution for Tailwind / global stylesheets.
  // Both directives reference real packages that knip wouldn't otherwise see.
  // We rewrite @plugin as @import so knip's resolver picks them up.
  compilers: {
    css: (text: string) => {
      const matches = [...text.matchAll(/@(?:import|plugin)\s+([^;]+);?/g)];
      return matches.map((m) => `import ${m[1]}`).join('\n');
    },
  },
};

export default config;
