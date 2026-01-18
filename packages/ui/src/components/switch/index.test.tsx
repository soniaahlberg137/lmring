import { fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Switch } from './index';

describe('Switch', () => {
  it('renders with default props', () => {
    render(<Switch />);
    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('forwards ref', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Switch ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('applies custom className', () => {
    render(<Switch className="custom-class" />);
    expect(screen.getByRole('switch')).toHaveClass('custom-class');
  });

  it('is unchecked by default', () => {
    render(<Switch />);
    expect(screen.getByRole('switch')).toHaveAttribute('data-state', 'unchecked');
  });

  it('can be checked by default', () => {
    render(<Switch defaultChecked />);
    expect(screen.getByRole('switch')).toHaveAttribute('data-state', 'checked');
  });

  it('toggles on click', () => {
    render(<Switch />);
    const switchElement = screen.getByRole('switch');

    expect(switchElement).toHaveAttribute('data-state', 'unchecked');
    fireEvent.click(switchElement);
    expect(switchElement).toHaveAttribute('data-state', 'checked');
    fireEvent.click(switchElement);
    expect(switchElement).toHaveAttribute('data-state', 'unchecked');
  });

  it('calls onCheckedChange when toggled', () => {
    const handleChange = vi.fn();
    render(<Switch onCheckedChange={handleChange} />);

    fireEvent.click(screen.getByRole('switch'));
    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it('can be controlled with checked prop', () => {
    const { rerender } = render(<Switch checked={false} />);
    expect(screen.getByRole('switch')).toHaveAttribute('data-state', 'unchecked');

    rerender(<Switch checked />);
    expect(screen.getByRole('switch')).toHaveAttribute('data-state', 'checked');
  });

  it('can be disabled', () => {
    render(<Switch disabled />);
    expect(screen.getByRole('switch')).toBeDisabled();
    expect(screen.getByRole('switch')).toHaveAttribute('data-disabled', '');
  });

  it('handles id prop', () => {
    render(<Switch id="notifications" />);
    expect(screen.getByRole('switch')).toHaveAttribute('id', 'notifications');
  });

  it('handles aria-label', () => {
    render(<Switch aria-label="Enable notifications" />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-label', 'Enable notifications');
  });
});
