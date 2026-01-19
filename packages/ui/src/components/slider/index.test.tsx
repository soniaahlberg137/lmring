import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { Slider } from './index';

describe('Slider', () => {
  it('renders', () => {
    const { container } = render(<Slider aria-label="Volume" />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('forwards ref', () => {
    const ref = createRef<HTMLSpanElement>();
    render(<Slider ref={ref} aria-label="Volume" />);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  it('applies custom className', () => {
    const { container } = render(<Slider className="custom-class" aria-label="Volume" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('applies default styles', () => {
    const { container } = render(<Slider aria-label="Volume" />);
    expect(container.firstChild).toHaveClass('relative', 'flex', 'w-full');
  });

  it('has horizontal orientation by default', () => {
    const { container } = render(<Slider aria-label="Volume" />);
    expect(container.firstChild).toHaveAttribute('data-orientation', 'horizontal');
  });

  it('can be disabled', () => {
    const { container } = render(<Slider disabled aria-label="Volume" />);
    expect(container.firstChild).toHaveAttribute('data-disabled', '');
  });
});
