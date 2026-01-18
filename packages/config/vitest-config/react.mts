import { defineConfig, mergeConfig } from 'vitest/config';
import { baseConfig } from './base.mts';

export const reactConfig = mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
    },
  }),
);

export default reactConfig;
