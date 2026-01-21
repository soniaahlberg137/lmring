import { render, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { useArenaStore } from '@/stores/arena-store';
import { useSettingsStore } from '@/stores/settings-store';
import { useWorkflowStore } from '@/stores/workflow-store';
import { StoreProviders } from './store-providers';

describe('StoreProviders', () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <StoreProviders>{children}</StoreProviders>
  );

  it('renders children correctly', () => {
    const { getByTestId } = render(
      <StoreProviders>
        <div data-testid="child">Test Child</div>
      </StoreProviders>,
    );

    expect(getByTestId('child')).toBeDefined();
    expect(getByTestId('child').textContent).toBe('Test Child');
  });

  it('provides SettingsStore context (useSettingsStore works)', () => {
    const { result } = renderHook(() => useSettingsStore((s) => s.activeTab), { wrapper });

    expect(result.current).toBe('general');
  });

  it('provides ArenaStore context (useArenaStore works)', () => {
    const { result } = renderHook(() => useArenaStore((s) => s.initialized), { wrapper });

    expect(result.current).toBe(false);
  });

  it('provides WorkflowStore context (useWorkflowStore works)', () => {
    const { result } = renderHook(() => useWorkflowStore((s) => s.globalPrompt), { wrapper });

    expect(result.current).toBe('');
  });

  it('nests providers in correct hierarchy', () => {
    const { result } = renderHook(
      () => ({
        settings: useSettingsStore((s) => s.activeTab),
        arena: useArenaStore((s) => s.initialized),
        workflow: useWorkflowStore((s) => s.globalPrompt),
      }),
      { wrapper },
    );

    expect(result.current.settings).toBe('general');
    expect(result.current.arena).toBe(false);
    expect(result.current.workflow).toBe('');
  });
});
