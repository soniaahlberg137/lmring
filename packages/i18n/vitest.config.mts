import { reactConfig } from '@lmring/vitest-config/react';
import { mergeConfig } from 'vitest/config';

export default mergeConfig(reactConfig, {
  test: {
    name: 'i18n',
  },
});
