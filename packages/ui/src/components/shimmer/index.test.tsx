import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Shimmer } from './index';

describe('Shimmer', () => {
  it('renders with children', () => {
    render(<Shimmer>Loading text</Shimmer>);
    expect(screen.getByText('Loading text')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Shimmer className="custom-class" data-testid="shimmer">Loading</Shimmer>);
    expect(screen.getByTestId('shimmer')).toHaveClass('custom-class');
  });

  it('applies default styles', () => {
    render(<Shimmer data-testid="shimmer">Loading</Shimmer>);
    expect(screen.getByTestId('shimmer')).toHaveClass('animate-shimmer', 'overflow-hidden');
  });

  it('sets default duration CSS variable', () => {
    render(<Shimmer data-testid="shimmer">Loading</Shimmer>);
    const element = screen.getByTestId('shimmer');
    expect(element.style.getPropertyValue('--shimmer-duration')).toBe('2s');
  });

  it('sets custom duration CSS variable', () => {
    render(<Shimmer duration={3} data-testid="shimmer">Loading</Shimmer>);
    const element = screen.getByTestId('shimmer');
    expect(element.style.getPropertyValue('--shimmer-duration')).toBe('3s');
  });

  it('forwards additional props', () => {
    render(<Shimmer data-testid="shimmer" aria-label="Loading content">Loading</Shimmer>);
    expect(screen.getByTestId('shimmer')).toHaveAttribute('aria-label', 'Loading content');
  });
});
