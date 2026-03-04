import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { tokens } from '../src/tokens';

/**
 * Property-based tests for design tokens.
 *
 * **Validates: Requirements 5.1**
 */

describe('Property P6: Spacing 4px alignment', () => {
  /**
   * **Validates: Requirements 5.1**
   *
   * All numeric spacing values in `tokens.spacing` (excluding 0)
   * are positive multiples of 4.
   */

  const spacingEntries = Object.entries(tokens.spacing)
    .filter(([key]) => key !== '0')
    .map(([key, value]) => [key, value] as const);

  it('all non-zero spacing values are positive multiples of 4', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...spacingEntries),
        ([key, cssValue]) => {
          const numericValue = Number.parseInt(cssValue, 10);

          // Must be a valid positive number
          expect(numericValue, `spacing[${key}] parsed to NaN`).not.toBeNaN();
          expect(numericValue, `spacing[${key}] = ${numericValue} is not positive`).toBeGreaterThan(0);

          // Must be a multiple of 4
          expect(
            numericValue % 4,
            `spacing[${key}] = ${numericValue}px is not a multiple of 4`,
          ).toBe(0);
        },
      ),
    );
  });
});
