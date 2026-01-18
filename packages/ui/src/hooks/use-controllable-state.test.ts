import { describe, expect, it } from 'vitest';
import { useControllableState } from './use-controllable-state';

describe('useControllableState', () => {
  it('is exported from @radix-ui/react-use-controllable-state', () => {
    expect(useControllableState).toBeDefined();
    expect(typeof useControllableState).toBe('function');
  });
});
