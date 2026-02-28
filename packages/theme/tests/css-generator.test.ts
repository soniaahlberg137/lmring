import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { paletteToCssVars } from '../src/css-generator';
import type { OklchColor, SemanticPalette } from '../src/types';

/**
 * Property-based tests for CSS variable generation.
 *
 * **Validates: Requirements 8.4**
 */

const SEMANTIC_KEYS: (keyof SemanticPalette)[] = [
  'primary',
  'primaryForeground',
  'secondary',
  'secondaryForeground',
  'accent',
  'accentForeground',
  'muted',
  'mutedForeground',
  'destructive',
  'destructiveForeground',
  'background',
  'foreground',
  'card',
  'cardForeground',
  'border',
  'input',
  'ring',
];

/** Arbitrary for a valid OklchColor within the design system's ranges. */
const oklchColorArb: fc.Arbitrary<OklchColor> = fc.record({
  l: fc.double({ min: 0, max: 1, noNaN: true }),
  c: fc.double({ min: 0, max: 0.4, noNaN: true }),
  h: fc.double({ min: 0, max: 359.999, noNaN: true }),
});

/** Arbitrary for a valid SemanticPalette with all 17 keys. */
const semanticPaletteArb: fc.Arbitrary<SemanticPalette> = fc.record(
  Object.fromEntries(SEMANTIC_KEYS.map((key) => [key, oklchColorArb])) as {
    [K in keyof SemanticPalette]: fc.Arbitrary<OklchColor>;
  },
);

const CSS_VAR_NAME_PATTERN = /^--[a-z0-9]+(-[a-z0-9]+)*$/;
const OKLCH_CSS_PATTERN =
  /^oklch\((\d+(\.\d+)?([eE][+-]?\d+)?) (\d+(\.\d+)?([eE][+-]?\d+)?) (\d+(\.\d+)?([eE][+-]?\d+)?)\)$/;

describe('Property P7: Design token naming convention', () => {
  /**
   * **Validates: Requirements 8.4**
   *
   * All CSS variable names from paletteToCssVars match --[a-z0-9]+(-[a-z0-9]+)*
   */
  it('all CSS variable names match the naming convention pattern', () => {
    fc.assert(
      fc.property(semanticPaletteArb, (palette) => {
        const vars = paletteToCssVars(palette);

        for (const varName of Object.keys(vars)) {
          expect(
            varName,
            `CSS variable name "${varName}" does not match naming convention`,
          ).toMatch(CSS_VAR_NAME_PATTERN);
        }
      }),
    );
  });

  it('all CSS variable values are valid oklch() strings', () => {
    fc.assert(
      fc.property(semanticPaletteArb, (palette) => {
        const vars = paletteToCssVars(palette);

        for (const [varName, value] of Object.entries(vars)) {
          expect(value, `Value for "${varName}" is not a valid oklch() string: "${value}"`).toMatch(
            OKLCH_CSS_PATTERN,
          );
        }
      }),
    );
  });
});
