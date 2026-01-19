import { baseConfig } from '@lmring/vitest-config';
import { mergeConfig } from 'vitest/config';

export default mergeConfig(baseConfig, {
  test: {
    name: 'model-depot',
  },
});
