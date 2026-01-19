import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FloatingCard } from './index';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: { children?: React.ReactNode; className?: string; [key: string]: unknown }) => (
      <div className={className} data-testid="motion-div" {...props}>{children}</div>
    ),
  },
}));

describe('FloatingCard', () => {
  it('renders with required name prop', () => {
    render(<FloatingCard name="GPT-4" />);
    expect(screen.getByText('GPT-4')).toBeInTheDocument();
  });

  it('renders with description', () => {
    render(<FloatingCard name="GPT-4" description="OpenAI" />);
    expect(screen.getByText('GPT-4')).toBeInTheDocument();
    expect(screen.getByText('OpenAI')).toBeInTheDocument();
  });

  it('renders without description when not provided', () => {
    render(<FloatingCard name="Claude" />);
    expect(screen.getByText('Claude')).toBeInTheDocument();
    expect(screen.queryByText('OpenAI')).not.toBeInTheDocument();
  });

  it('renders with icon', () => {
    render(
      <FloatingCard
        name="Model"
        icon={<span data-testid="icon">🤖</span>}
      />
    );
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<FloatingCard name="Test" className="custom-position" />);
    expect(screen.getByTestId('motion-div')).toHaveClass('custom-position');
  });

  it('applies default styles', () => {
    render(<FloatingCard name="Test" />);
    expect(screen.getByTestId('motion-div')).toHaveClass(
      'absolute',
      'rounded-xl',
      'border',
      'backdrop-blur-md'
    );
  });

  it('accepts delay prop', () => {
    render(<FloatingCard name="Test" delay={1.5} />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('accepts duration prop', () => {
    render(<FloatingCard name="Test" duration={6} />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
