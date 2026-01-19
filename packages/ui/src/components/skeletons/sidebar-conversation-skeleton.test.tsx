import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SidebarConversationSkeleton } from './sidebar-conversation-skeleton';

describe('SidebarConversationSkeleton', () => {
  it('renders default count of 5 items', () => {
    const { container } = render(<SidebarConversationSkeleton />);
    const items = container.querySelectorAll('.flex.items-center.gap-2');
    expect(items).toHaveLength(5);
  });

  it('renders specified count of items', () => {
    const { container } = render(<SidebarConversationSkeleton count={3} />);
    const items = container.querySelectorAll('.flex.items-center.gap-2');
    expect(items).toHaveLength(3);
  });

  it('renders with count of 1', () => {
    const { container } = render(<SidebarConversationSkeleton count={1} />);
    const items = container.querySelectorAll('.flex.items-center.gap-2');
    expect(items).toHaveLength(1);
  });

  it('contains skeleton elements', () => {
    const { container } = render(<SidebarConversationSkeleton count={1} />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
