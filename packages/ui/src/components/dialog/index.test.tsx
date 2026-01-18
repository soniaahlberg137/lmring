import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from './index';

// Mock framer-motion to avoid animation issues
vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, className, ...props }: { children?: React.ReactNode; className?: string; [key: string]: unknown }) => (
      <div className={className} {...props}>{children}</div>
    ),
  },
}));

describe('Dialog', () => {
  it('renders trigger', () => {
    render(
      <Dialog>
        <DialogTrigger>Open Dialog</DialogTrigger>
      </Dialog>
    );
    expect(screen.getByText('Open Dialog')).toBeInTheDocument();
  });

  it('renders content when open is true', () => {
    render(
      <Dialog open>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent open>
          <DialogHeader>
            <DialogTitle>Title</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});

describe('DialogTrigger', () => {
  it('renders as button by default', () => {
    render(
      <Dialog>
        <DialogTrigger>Click me</DialogTrigger>
      </Dialog>
    );
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('renders asChild', () => {
    render(
      <Dialog>
        <DialogTrigger asChild>
          <span data-testid="custom">Custom trigger</span>
        </DialogTrigger>
      </Dialog>
    );
    expect(screen.getByTestId('custom')).toBeInTheDocument();
  });
});

describe('DialogContent', () => {
  it('renders when open', () => {
    render(
      <Dialog open>
        <DialogContent open>Dialog content</DialogContent>
      </Dialog>
    );
    expect(screen.getByText('Dialog content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <Dialog open>
        <DialogContent open className="custom-dialog">Content</DialogContent>
      </Dialog>
    );
    expect(screen.getByRole('dialog')).toHaveClass('custom-dialog');
  });

  it('renders close button', () => {
    render(
      <Dialog open>
        <DialogContent open>Content</DialogContent>
      </Dialog>
    );
    expect(screen.getByText('Close')).toBeInTheDocument();
  });
});

describe('DialogHeader', () => {
  it('renders with children', () => {
    render(
      <Dialog open>
        <DialogContent open>
          <DialogHeader data-testid="header">
            <DialogTitle>Title</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
    expect(screen.getByTestId('header')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <Dialog open>
        <DialogContent open>
          <DialogHeader className="custom-header" data-testid="header">
            <DialogTitle>Title</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
    expect(screen.getByTestId('header')).toHaveClass('custom-header');
  });

  it('applies default styles', () => {
    render(
      <Dialog open>
        <DialogContent open>
          <DialogHeader data-testid="header">
            <DialogTitle>Title</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
    expect(screen.getByTestId('header')).toHaveClass('flex', 'flex-col');
  });
});

describe('DialogFooter', () => {
  it('renders with children', () => {
    render(
      <Dialog open>
        <DialogContent open>
          <DialogFooter data-testid="footer">
            <button type="button">Cancel</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <Dialog open>
        <DialogContent open>
          <DialogFooter className="custom-footer" data-testid="footer">
            <button type="button">OK</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
    expect(screen.getByTestId('footer')).toHaveClass('custom-footer');
  });
});

describe('DialogTitle', () => {
  it('renders title', () => {
    render(
      <Dialog open>
        <DialogContent open>
          <DialogTitle>My Title</DialogTitle>
        </DialogContent>
      </Dialog>
    );
    expect(screen.getByText('My Title')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <Dialog open>
        <DialogContent open>
          <DialogTitle className="custom-title" data-testid="title">Title</DialogTitle>
        </DialogContent>
      </Dialog>
    );
    expect(screen.getByTestId('title')).toHaveClass('custom-title');
  });
});

describe('DialogDescription', () => {
  it('renders description', () => {
    render(
      <Dialog open>
        <DialogContent open>
          <DialogDescription>Description text</DialogDescription>
        </DialogContent>
      </Dialog>
    );
    expect(screen.getByText('Description text')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <Dialog open>
        <DialogContent open>
          <DialogDescription className="custom-desc" data-testid="desc">
            Description
          </DialogDescription>
        </DialogContent>
      </Dialog>
    );
    expect(screen.getByTestId('desc')).toHaveClass('custom-desc');
  });
});

describe('Dialog exports', () => {
  it('exports all components', () => {
    expect(Dialog).toBeDefined();
    expect(DialogPortal).toBeDefined();
    expect(DialogOverlay).toBeDefined();
    expect(DialogClose).toBeDefined();
    expect(DialogTrigger).toBeDefined();
    expect(DialogContent).toBeDefined();
    expect(DialogHeader).toBeDefined();
    expect(DialogFooter).toBeDefined();
    expect(DialogTitle).toBeDefined();
    expect(DialogDescription).toBeDefined();
  });
});
