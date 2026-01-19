import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Skeleton } from './index';

describe('Skeleton', () => {
  it('renders as a div', () => {
    render(<Skeleton data-testid="skeleton" />);
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
  });

  it('applies default styles', () => {
    render(<Skeleton data-testid="skeleton" />);
    expect(screen.getByTestId('skeleton')).toHaveClass('animate-pulse', 'rounded-md', 'bg-muted');
  });

  it('applies custom className', () => {
    render(<Skeleton className="custom-class" data-testid="skeleton" />);
    expect(screen.getByTestId('skeleton')).toHaveClass('custom-class');
  });

  it('merges custom className with default styles', () => {
    render(<Skeleton className="h-4 w-20" data-testid="skeleton" />);
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveClass('animate-pulse', 'h-4', 'w-20');
  });

  it('renders with children', () => {
    render(
      <Skeleton data-testid="skeleton">
        <span>Loading...</span>
      </Skeleton>
    );
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('forwards additional props', () => {
    render(<Skeleton data-testid="skeleton" aria-label="Loading content" />);
    expect(screen.getByTestId('skeleton')).toHaveAttribute('aria-label', 'Loading content');
  });
});
