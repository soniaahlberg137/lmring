import { describe, expect, it } from 'vitest';
import {
  defaultScrollbar,
  hiddenScrollbar,
  minimalScrollbar,
  scrollbarStyles,
  thinScrollbar,
} from './scrollbar';

describe('scrollbar', () => {
  describe('scrollbarStyles', () => {
    it('should have thin style defined', () => {
      expect(scrollbarStyles.thin).toBeDefined();
      expect(typeof scrollbarStyles.thin).toBe('string');
      expect(scrollbarStyles.thin.length).toBeGreaterThan(0);
    });

    it('should have hidden style defined', () => {
      expect(scrollbarStyles.hidden).toBeDefined();
      expect(typeof scrollbarStyles.hidden).toBe('string');
      expect(scrollbarStyles.hidden.length).toBeGreaterThan(0);
    });

    it('should have default style defined', () => {
      expect(scrollbarStyles.default).toBeDefined();
      expect(typeof scrollbarStyles.default).toBe('string');
      expect(scrollbarStyles.default.length).toBeGreaterThan(0);
    });

    it('should have minimal style defined', () => {
      expect(scrollbarStyles.minimal).toBeDefined();
      expect(typeof scrollbarStyles.minimal).toBe('string');
      expect(scrollbarStyles.minimal.length).toBeGreaterThan(0);
    });

    it('thin should contain scrollbar width class', () => {
      expect(scrollbarStyles.thin).toContain('[&::-webkit-scrollbar]:w-');
    });

    it('hidden should contain scrollbar-none', () => {
      expect(scrollbarStyles.hidden).toContain('scrollbar-none');
    });

    it('default should contain thumb and track styles', () => {
      expect(scrollbarStyles.default).toContain('[&::-webkit-scrollbar-thumb]');
      expect(scrollbarStyles.default).toContain('[&::-webkit-scrollbar-track]');
    });

    it('minimal should contain transparent track', () => {
      expect(scrollbarStyles.minimal).toContain('bg-transparent');
    });
  });

  describe('exported aliases', () => {
    it('thinScrollbar should match scrollbarStyles.thin', () => {
      expect(thinScrollbar).toBe(scrollbarStyles.thin);
    });

    it('hiddenScrollbar should match scrollbarStyles.hidden', () => {
      expect(hiddenScrollbar).toBe(scrollbarStyles.hidden);
    });

    it('defaultScrollbar should match scrollbarStyles.default', () => {
      expect(defaultScrollbar).toBe(scrollbarStyles.default);
    });

    it('minimalScrollbar should match scrollbarStyles.minimal', () => {
      expect(minimalScrollbar).toBe(scrollbarStyles.minimal);
    });
  });

  describe('style content', () => {
    it('all styles should be space-separated class strings', () => {
      for (const style of Object.values(scrollbarStyles)) {
        expect(style).not.toContain('\n');
        expect(style).not.toContain('\t');
      }
    });

    it('styles should not have leading or trailing whitespace', () => {
      for (const style of Object.values(scrollbarStyles)) {
        expect(style).toBe(style.trim());
      }
    });
  });
});
