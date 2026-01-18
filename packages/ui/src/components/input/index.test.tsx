import { fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Input } from './index';

describe('Input', () => {
  it('renders with default props', () => {
    render(<Input />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('forwards ref', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('applies custom className', () => {
    render(<Input className="custom-class" />);
    expect(screen.getByRole('textbox')).toHaveClass('custom-class');
  });

  it('handles type prop', () => {
    render(<Input type="email" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');
  });

  it('handles password type', () => {
    render(<Input type="password" data-testid="password-input" />);
    expect(screen.getByTestId('password-input')).toHaveAttribute('type', 'password');
  });

  it('handles placeholder', () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('handles value and onChange', () => {
    const handleChange = vi.fn();
    render(<Input onChange={handleChange} />);

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'hello' } });
    expect(handleChange).toHaveBeenCalled();
  });

  it('can be disabled', () => {
    render(<Input disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('handles readOnly prop', () => {
    render(<Input readOnly defaultValue="read only" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('readonly');
  });

  it('handles name prop', () => {
    render(<Input name="username" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('name', 'username');
  });

  it('handles id prop', () => {
    render(<Input id="my-input" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('id', 'my-input');
  });

  it('handles aria attributes', () => {
    render(<Input aria-label="Search" aria-describedby="hint" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-label', 'Search');
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-describedby', 'hint');
  });
});
