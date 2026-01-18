import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { Separator } from './index';

describe('Separator', () => {
  it('renders with default props', () => {
    render(<Separator data-testid="separator" />);
    expect(screen.getByTestId('separator')).toBeInTheDocument();
  });

  it('forwards ref', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Separator ref={ref} data-testid="separator" />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('applies custom className', () => {
    render(<Separator className="custom-class" data-testid="separator" />);
    expect(screen.getByTestId('separator')).toHaveClass('custom-class');
  });

  it('applies horizontal orientation by default', () => {
    render(<Separator data-testid="separator" />);
    const separator = screen.getByTestId('separator');
    expect(separator).toHaveClass('h-[1px]', 'w-full');
    expect(separator).toHaveAttribute('data-orientation', 'horizontal');
  });

  it('applies vertical orientation', () => {
    render(<Separator orientation="vertical" data-testid="separator" />);
    const separator = screen.getByTestId('separator');
    expect(separator).toHaveClass('h-full', 'w-[1px]');
    expect(separator).toHaveAttribute('data-orientation', 'vertical');
  });

  it('is decorative by default', () => {
    render(<Separator data-testid="separator" />);
    expect(screen.getByTestId('separator')).toHaveAttribute('role', 'none');
  });

  it('has separator role when not decorative', () => {
    render(<Separator decorative={false} data-testid="separator" />);
    expect(screen.getByTestId('separator')).toHaveAttribute('role', 'separator');
  });
});
