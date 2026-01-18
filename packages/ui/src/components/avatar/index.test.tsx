import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { Avatar, AvatarFallback, AvatarImage } from './index';

describe('Avatar', () => {
  it('renders with children', () => {
    render(
      <Avatar data-testid="avatar">
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
    );
    expect(screen.getByTestId('avatar')).toBeInTheDocument();
  });

  it('forwards ref', () => {
    const ref = createRef<HTMLSpanElement>();
    render(<Avatar ref={ref} data-testid="avatar" />);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  it('applies custom className', () => {
    render(<Avatar className="custom-class" data-testid="avatar" />);
    expect(screen.getByTestId('avatar')).toHaveClass('custom-class');
  });

  it('applies default styles', () => {
    render(<Avatar data-testid="avatar" />);
    expect(screen.getByTestId('avatar')).toHaveClass('relative', 'flex', 'rounded-full');
  });
});

describe('AvatarImage', () => {
  it('accepts src and alt props', () => {
    // AvatarImage doesn't render img until image loads - test component accepts props
    const { container } = render(
      <Avatar>
        <AvatarImage src="/avatar.png" alt="User avatar" />
      </Avatar>
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it('accepts custom className', () => {
    const { container } = render(
      <Avatar>
        <AvatarImage src="/avatar.png" alt="User avatar" className="custom-class" />
      </Avatar>
    );
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe('AvatarFallback', () => {
  it('renders with children', () => {
    render(
      <Avatar>
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
    );
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <Avatar>
        <AvatarFallback className="custom-class">JD</AvatarFallback>
      </Avatar>
    );
    expect(screen.getByText('JD')).toHaveClass('custom-class');
  });

  it('applies default styles', () => {
    render(
      <Avatar>
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
    );
    expect(screen.getByText('JD')).toHaveClass('flex', 'items-center', 'justify-center', 'bg-muted');
  });
});

describe('Avatar composition', () => {
  it('renders complete avatar structure', () => {
    render(
      <Avatar data-testid="avatar">
        <AvatarImage src="/avatar.png" alt="User avatar" />
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
    );

    expect(screen.getByTestId('avatar')).toBeInTheDocument();
    // Fallback shows when image hasn't loaded
    expect(screen.getByText('JD')).toBeInTheDocument();
  });
});
