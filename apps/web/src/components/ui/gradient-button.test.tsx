import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { GradientButton } from './gradient-button';

describe('GradientButton', () => {
  it('forwards ref to inner button', () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<GradientButton ref={ref}>Click</GradientButton>);

    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    expect(screen.getByRole('button', { name: 'Click' })).toBe(ref.current);
  });

  it('spreads props and handles onClick', () => {
    const onClick = vi.fn();
    render(
      <GradientButton onClick={onClick} data-testid="btn">
        Click
      </GradientButton>,
    );

    fireEvent.click(screen.getByTestId('btn'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
