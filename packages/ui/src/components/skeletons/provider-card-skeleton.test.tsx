import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProviderCardSkeleton } from './provider-card-skeleton';

describe('ProviderCardSkeleton', () => {
  it('renders default count of 6 cards', () => {
    const { container } = render(<ProviderCardSkeleton />);
    const cards = container.querySelectorAll('.rounded-xl.border.bg-card');
    expect(cards).toHaveLength(6);
  });

  it('renders specified count of cards', () => {
    const { container } = render(<ProviderCardSkeleton count={3} />);
    const cards = container.querySelectorAll('.rounded-xl.border.bg-card');
    expect(cards).toHaveLength(3);
  });

  it('renders with count of 1', () => {
    const { container } = render(<ProviderCardSkeleton count={1} />);
    const cards = container.querySelectorAll('.rounded-xl.border.bg-card');
    expect(cards).toHaveLength(1);
  });

  it('contains skeleton elements', () => {
    const { container } = render(<ProviderCardSkeleton count={1} />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
