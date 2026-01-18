import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { Label } from './index';

describe('Label', () => {
  it('renders with children', () => {
    render(<Label>Username</Label>);
    expect(screen.getByText('Username')).toBeInTheDocument();
  });

  it('forwards ref', () => {
    const ref = createRef<HTMLLabelElement>();
    render(<Label ref={ref}>Username</Label>);
    expect(ref.current).toBeInstanceOf(HTMLLabelElement);
  });

  it('applies custom className', () => {
    render(<Label className="custom-class">Username</Label>);
    expect(screen.getByText('Username')).toHaveClass('custom-class');
  });

  it('has htmlFor attribute', () => {
    render(<Label htmlFor="username-input">Username</Label>);
    expect(screen.getByText('Username')).toHaveAttribute('for', 'username-input');
  });

  it('applies default styles', () => {
    render(<Label>Username</Label>);
    expect(screen.getByText('Username')).toHaveClass('text-sm', 'font-medium');
  });

  it('handles id prop', () => {
    render(<Label id="my-label">Username</Label>);
    expect(screen.getByText('Username')).toHaveAttribute('id', 'my-label');
  });
});
