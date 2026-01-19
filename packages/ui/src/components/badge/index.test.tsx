import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Badge, badgeVariants } from './index';

describe('Badge', () => {
  it('renders with children', () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Badge className="custom-class">New</Badge>);
    expect(screen.getByText('New')).toHaveClass('custom-class');
  });

  describe('variants', () => {
    it('applies default variant', () => {
      render(<Badge>Default</Badge>);
      expect(screen.getByText('Default')).toHaveClass('bg-primary');
    });

    it('applies secondary variant', () => {
      render(<Badge variant="secondary">Secondary</Badge>);
      expect(screen.getByText('Secondary')).toHaveClass('bg-secondary');
    });

    it('applies destructive variant', () => {
      render(<Badge variant="destructive">Destructive</Badge>);
      expect(screen.getByText('Destructive')).toHaveClass('bg-destructive');
    });

    it('applies outline variant', () => {
      render(<Badge variant="outline">Outline</Badge>);
      expect(screen.getByText('Outline')).toHaveClass('text-foreground');
    });
  });
});

describe('badgeVariants', () => {
  it('returns default variant classes', () => {
    const classes = badgeVariants();
    expect(classes).toContain('bg-primary');
  });

  it('returns variant-specific classes', () => {
    const classes = badgeVariants({ variant: 'destructive' });
    expect(classes).toContain('bg-destructive');
  });

  it('merges custom className', () => {
    const classes = badgeVariants({ className: 'custom-class' });
    expect(classes).toContain('custom-class');
  });
});
