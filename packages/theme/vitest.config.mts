import { baseConfig } from '@lmring/vitest-config';
import { mergeConfig } from 'vitest/config';

export default mergeConfig(baseConfig, {
  test: {
    name: 'theme',
    include: ['src/**/*.test.{ts,tsx}', 'tests/**/*.test.{ts,tsx}'],
  },
});
