import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './index';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, className, ...props }: { children?: React.ReactNode; className?: string; [key: string]: unknown }) => (
      <div className={className} {...props}>{children}</div>
    ),
  },
}));

describe('AlertDialog', () => {
  it('renders trigger', () => {
    render(
      <AlertDialog>
        <AlertDialogTrigger>Delete</AlertDialogTrigger>
      </AlertDialog>
    );
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('renders content when open', () => {
    render(
      <AlertDialog open>
        <AlertDialogTrigger>Delete</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>
    );
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });
});

describe('AlertDialogTrigger', () => {
  it('renders as button by default', () => {
    render(
      <AlertDialog>
        <AlertDialogTrigger>Trigger</AlertDialogTrigger>
      </AlertDialog>
    );
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('renders asChild', () => {
    render(
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <span data-testid="custom">Custom</span>
        </AlertDialogTrigger>
      </AlertDialog>
    );
    expect(screen.getByTestId('custom')).toBeInTheDocument();
  });
});

describe('AlertDialogContent', () => {
  it('renders when open', () => {
    render(
      <AlertDialog open>
        <AlertDialogContent>Alert content</AlertDialogContent>
      </AlertDialog>
    );
    expect(screen.getByText('Alert content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <AlertDialog open>
        <AlertDialogContent className="custom-alert">Content</AlertDialogContent>
      </AlertDialog>
    );
    expect(screen.getByRole('alertdialog')).toHaveClass('custom-alert');
  });
});

describe('AlertDialogHeader', () => {
  it('renders with children', () => {
    render(
      <AlertDialog open>
        <AlertDialogContent>
          <AlertDialogHeader data-testid="header">
            <AlertDialogTitle>Title</AlertDialogTitle>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>
    );
    expect(screen.getByTestId('header')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <AlertDialog open>
        <AlertDialogContent>
          <AlertDialogHeader className="custom-header" data-testid="header">
            <AlertDialogTitle>Title</AlertDialogTitle>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>
    );
    expect(screen.getByTestId('header')).toHaveClass('custom-header');
  });

  it('applies default styles', () => {
    render(
      <AlertDialog open>
        <AlertDialogContent>
          <AlertDialogHeader data-testid="header">
            <AlertDialogTitle>Title</AlertDialogTitle>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>
    );
    expect(screen.getByTestId('header')).toHaveClass('flex', 'flex-col');
  });
});

describe('AlertDialogFooter', () => {
  it('renders with children', () => {
    render(
      <AlertDialog open>
        <AlertDialogContent>
          <AlertDialogFooter data-testid="footer">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <AlertDialog open>
        <AlertDialogContent>
          <AlertDialogFooter className="custom-footer" data-testid="footer">
            <AlertDialogAction>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
    expect(screen.getByTestId('footer')).toHaveClass('custom-footer');
  });
});

describe('AlertDialogTitle', () => {
  it('renders title', () => {
    render(
      <AlertDialog open>
        <AlertDialogContent>
          <AlertDialogTitle>Warning!</AlertDialogTitle>
        </AlertDialogContent>
      </AlertDialog>
    );
    expect(screen.getByText('Warning!')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <AlertDialog open>
        <AlertDialogContent>
          <AlertDialogTitle className="custom-title" data-testid="title">
            Title
          </AlertDialogTitle>
        </AlertDialogContent>
      </AlertDialog>
    );
    expect(screen.getByTestId('title')).toHaveClass('custom-title');
  });
});

describe('AlertDialogDescription', () => {
  it('renders description', () => {
    render(
      <AlertDialog open>
        <AlertDialogContent>
          <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
        </AlertDialogContent>
      </AlertDialog>
    );
    expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <AlertDialog open>
        <AlertDialogContent>
          <AlertDialogDescription className="custom-desc" data-testid="desc">
            Description
          </AlertDialogDescription>
        </AlertDialogContent>
      </AlertDialog>
    );
    expect(screen.getByTestId('desc')).toHaveClass('custom-desc');
  });
});

describe('AlertDialogAction', () => {
  it('renders action button', () => {
    render(
      <AlertDialog open>
        <AlertDialogContent>
          <AlertDialogAction>Continue</AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    );
    expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <AlertDialog open>
        <AlertDialogContent>
          <AlertDialogAction className="custom-action">OK</AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    );
    expect(screen.getByRole('button', { name: 'OK' })).toHaveClass('custom-action');
  });
});

describe('AlertDialogCancel', () => {
  it('renders cancel button', () => {
    render(
      <AlertDialog open>
        <AlertDialogContent>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
        </AlertDialogContent>
      </AlertDialog>
    );
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <AlertDialog open>
        <AlertDialogContent>
          <AlertDialogCancel className="custom-cancel">Cancel</AlertDialogCancel>
        </AlertDialogContent>
      </AlertDialog>
    );
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveClass('custom-cancel');
  });
});

describe('AlertDialog exports', () => {
  it('exports all components', () => {
    expect(AlertDialog).toBeDefined();
    expect(AlertDialogPortal).toBeDefined();
    expect(AlertDialogOverlay).toBeDefined();
    expect(AlertDialogTrigger).toBeDefined();
    expect(AlertDialogContent).toBeDefined();
    expect(AlertDialogHeader).toBeDefined();
    expect(AlertDialogFooter).toBeDefined();
    expect(AlertDialogTitle).toBeDefined();
    expect(AlertDialogDescription).toBeDefined();
    expect(AlertDialogAction).toBeDefined();
    expect(AlertDialogCancel).toBeDefined();
  });
});
