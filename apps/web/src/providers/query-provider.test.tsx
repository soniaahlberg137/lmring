import { useQueryClient } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { QueryProvider } from './query-provider';

describe('QueryProvider', () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryProvider>{children}</QueryProvider>
  );

  it('renders children correctly', () => {
    const TestChild = () => <div data-testid="test-child">Test</div>;
    const { result } = renderHook(
      () => {
        useQueryClient();
        return true;
      },
      {
        wrapper: ({ children }) => (
          <QueryProvider>
            <TestChild />
            {children}
          </QueryProvider>
        ),
      },
    );

    expect(result.current).toBe(true);
  });

  it('creates QueryClient with staleTime of 5 minutes (300000ms)', () => {
    const { result } = renderHook(() => useQueryClient(), { wrapper });

    const defaultOptions = result.current.getDefaultOptions();
    expect(defaultOptions.queries?.staleTime).toBe(5 * 60 * 1000);
  });

  it('creates QueryClient with gcTime of 10 minutes (600000ms)', () => {
    const { result } = renderHook(() => useQueryClient(), { wrapper });

    const defaultOptions = result.current.getDefaultOptions();
    expect(defaultOptions.queries?.gcTime).toBe(10 * 60 * 1000);
  });

  it('creates QueryClient with refetchOnWindowFocus disabled', () => {
    const { result } = renderHook(() => useQueryClient(), { wrapper });

    const defaultOptions = result.current.getDefaultOptions();
    expect(defaultOptions.queries?.refetchOnWindowFocus).toBe(false);
  });

  it('creates QueryClient with retry set to 2', () => {
    const { result } = renderHook(() => useQueryClient(), { wrapper });

    const defaultOptions = result.current.getDefaultOptions();
    expect(defaultOptions.queries?.retry).toBe(2);
  });

  it('provides QueryClient context to descendants', () => {
    const { result } = renderHook(() => useQueryClient(), { wrapper });

    expect(result.current).toBeDefined();
    expect(typeof result.current.getDefaultOptions).toBe('function');
  });

  it('maintains same QueryClient instance across re-renders', () => {
    const { result, rerender } = renderHook(() => useQueryClient(), { wrapper });

    const firstInstance = result.current;
    rerender();
    const secondInstance = result.current;

    expect(firstInstance).toBe(secondInstance);
  });
});
