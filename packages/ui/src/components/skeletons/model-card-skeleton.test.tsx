import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ModelCardSkeleton } from './model-card-skeleton';

describe('ModelCardSkeleton', () => {
  it('renders default count of 2 cards', () => {
    const { container } = render(<ModelCardSkeleton />);
    const cards = container.querySelectorAll('.rounded-xl.border.bg-card');
    expect(cards).toHaveLength(2);
  });

  it('renders specified count of cards', () => {
    const { container } = render(<ModelCardSkeleton count={4} />);
    const cards = container.querySelectorAll('.rounded-xl.border.bg-card');
    expect(cards).toHaveLength(4);
  });

  it('renders with count of 1', () => {
    const { container } = render(<ModelCardSkeleton count={1} />);
    const cards = container.querySelectorAll('.rounded-xl.border.bg-card');
    expect(cards).toHaveLength(1);
  });

  it('contains skeleton elements', () => {
    const { container } = render(<ModelCardSkeleton count={1} />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
