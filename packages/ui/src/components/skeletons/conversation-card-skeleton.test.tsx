import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ConversationCardSkeleton } from './conversation-card-skeleton';

describe('ConversationCardSkeleton', () => {
  it('renders default count of 5 cards', () => {
    const { container } = render(<ConversationCardSkeleton />);
    const cards = container.querySelectorAll('.rounded-xl.border.bg-card');
    expect(cards).toHaveLength(5);
  });

  it('renders specified count of cards', () => {
    const { container } = render(<ConversationCardSkeleton count={3} />);
    const cards = container.querySelectorAll('.rounded-xl.border.bg-card');
    expect(cards).toHaveLength(3);
  });

  it('renders with count of 1', () => {
    const { container } = render(<ConversationCardSkeleton count={1} />);
    const cards = container.querySelectorAll('.rounded-xl.border.bg-card');
    expect(cards).toHaveLength(1);
  });

  it('contains skeleton elements', () => {
    const { container } = render(<ConversationCardSkeleton count={1} />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
