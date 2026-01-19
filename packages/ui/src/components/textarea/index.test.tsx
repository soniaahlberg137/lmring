import { fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Textarea } from './index';

describe('Textarea', () => {
  it('renders with default props', () => {
    render(<Textarea />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('forwards ref', () => {
    const ref = createRef<HTMLTextAreaElement>();
    render(<Textarea ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
  });

  it('applies custom className', () => {
    render(<Textarea className="custom-class" />);
    expect(screen.getByRole('textbox')).toHaveClass('custom-class');
  });

  it('handles placeholder', () => {
    render(<Textarea placeholder="Enter description" />);
    expect(screen.getByPlaceholderText('Enter description')).toBeInTheDocument();
  });

  it('handles value and onChange', () => {
    const handleChange = vi.fn();
    render(<Textarea onChange={handleChange} />);

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'hello' } });
    expect(handleChange).toHaveBeenCalled();
  });

  it('can be disabled', () => {
    render(<Textarea disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('handles readOnly prop', () => {
    render(<Textarea readOnly defaultValue="read only" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('readonly');
  });

  it('handles name prop', () => {
    render(<Textarea name="description" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('name', 'description');
  });

  it('handles id prop', () => {
    render(<Textarea id="my-textarea" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('id', 'my-textarea');
  });

  it('handles rows prop', () => {
    render(<Textarea rows={10} />);
    expect(screen.getByRole('textbox')).toHaveAttribute('rows', '10');
  });

  it('handles aria attributes', () => {
    render(<Textarea aria-label="Description" aria-describedby="hint" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-label', 'Description');
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-describedby', 'hint');
  });
});
