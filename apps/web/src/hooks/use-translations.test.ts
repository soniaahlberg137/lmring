import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTranslations } from './use-translations';

const mockT = vi.fn();

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mockT,
    i18n: {},
    ready: true,
  }),
}));

describe('useTranslations', () => {
  beforeEach(() => {
    mockT.mockClear();
  });

  it('returns a translation function', () => {
    mockT.mockReturnValue('Translated text');

    const { result } = renderHook(() => useTranslations());

    expect(typeof result.current).toBe('function');
  });

  it('translates with a simple key', () => {
    mockT.mockReturnValue('Hello World');

    const { result } = renderHook(() => useTranslations());
    // @ts-expect-error - testing with mock key
    const translated = result.current('greeting');

    expect(mockT).toHaveBeenCalledWith('greeting');
    expect(translated).toBe('Hello World');
  });

  it('translates with interpolation values', () => {
    mockT.mockReturnValue('Hello John');

    const { result } = renderHook(() => useTranslations());
    // @ts-expect-error - testing with mock key
    const translated = result.current('greeting_name', { name: 'John' });

    expect(mockT).toHaveBeenCalledWith('greeting_name', { name: 'John' });
    expect(translated).toBe('Hello John');
  });

  it('returns key when translation is missing', () => {
    mockT.mockImplementation((key: string) => key);

    const { result } = renderHook(() => useTranslations());
    // @ts-expect-error - testing with mock key
    const translated = result.current('missing_key');

    expect(translated).toBe('missing_key');
  });

  it('handles various interpolation value types', () => {
    mockT.mockReturnValue('Count: 42, Active: true');

    const { result } = renderHook(() => useTranslations());
    // @ts-expect-error - testing with mock key
    const translated = result.current('stats', { count: 42, active: true });

    expect(mockT).toHaveBeenCalledWith('stats', { count: 42, active: true });
    expect(translated).toBe('Count: 42, Active: true');
  });

  it('memoizes the translate function', () => {
    mockT.mockReturnValue('Test');

    const { result, rerender } = renderHook(() => useTranslations());
    const firstTranslate = result.current;

    rerender();
    const secondTranslate = result.current;

    expect(firstTranslate).toBe(secondTranslate);
  });

  it('handles null and undefined values in interpolation', () => {
    mockT.mockReturnValue('Value: null');

    const { result } = renderHook(() => useTranslations());
    // @ts-expect-error - testing with mock key
    const translated = result.current('value_display', { value: null });

    expect(mockT).toHaveBeenCalledWith('value_display', { value: null });
    expect(translated).toBe('Value: null');
  });

  it('handles date values in interpolation', () => {
    const date = new Date('2025-01-01');
    mockT.mockReturnValue('Date: 2025-01-01');

    const { result } = renderHook(() => useTranslations());
    // @ts-expect-error - testing with mock key
    const translated = result.current('date_display', { date });

    expect(mockT).toHaveBeenCalledWith('date_display', { date });
    expect(translated).toBe('Date: 2025-01-01');
  });
});
