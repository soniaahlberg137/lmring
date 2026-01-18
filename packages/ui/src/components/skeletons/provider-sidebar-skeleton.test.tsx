import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProviderSidebarSkeleton } from './provider-sidebar-skeleton';

describe('ProviderSidebarSkeleton', () => {
  it('renders default count of 8 items', () => {
    const { container } = render(<ProviderSidebarSkeleton />);
    const items = container.querySelectorAll('.flex.items-center.gap-3');
    expect(items).toHaveLength(8);
  });

  it('renders specified count of items', () => {
    const { container } = render(<ProviderSidebarSkeleton count={4} />);
    const items = container.querySelectorAll('.flex.items-center.gap-3');
    expect(items).toHaveLength(4);
  });

  it('renders with count of 1', () => {
    const { container } = render(<ProviderSidebarSkeleton count={1} />);
    const items = container.querySelectorAll('.flex.items-center.gap-3');
    expect(items).toHaveLength(1);
  });

  it('contains skeleton elements', () => {
    const { container } = render(<ProviderSidebarSkeleton count={1} />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
