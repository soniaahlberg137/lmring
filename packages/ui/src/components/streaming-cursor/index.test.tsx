import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StreamingCursor } from './index';

describe('StreamingCursor', () => {
  it('renders', () => {
    render(<StreamingCursor />);
    const cursor = document.querySelector('span');
    expect(cursor).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<StreamingCursor className="custom-class" />);
    const cursor = document.querySelector('span');
    expect(cursor).toHaveClass('custom-class');
  });

  it('applies default styles', () => {
    render(<StreamingCursor />);
    const cursor = document.querySelector('span');
    expect(cursor).toHaveClass('inline-block', 'animate-blink');
  });

  it('is hidden from screen readers', () => {
    render(<StreamingCursor />);
    const cursor = document.querySelector('span');
    expect(cursor).toHaveAttribute('aria-hidden', 'true');
  });
});
