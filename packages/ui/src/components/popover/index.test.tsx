import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from './index';

describe('Popover', () => {
  it('renders trigger', () => {
    render(
      <Popover>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent>Content</PopoverContent>
      </Popover>
    );
    expect(screen.getByText('Open')).toBeInTheDocument();
  });

  it('renders content when open', () => {
    render(
      <Popover open>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent>Content here</PopoverContent>
      </Popover>
    );
    expect(screen.getByText('Content here')).toBeInTheDocument();
  });
});

describe('PopoverTrigger', () => {
  it('renders as button by default', () => {
    render(
      <Popover>
        <PopoverTrigger>Click me</PopoverTrigger>
      </Popover>
    );
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('renders asChild', () => {
    render(
      <Popover>
        <PopoverTrigger asChild>
          <span data-testid="custom-trigger">Custom</span>
        </PopoverTrigger>
      </Popover>
    );
    expect(screen.getByTestId('custom-trigger')).toBeInTheDocument();
  });
});

describe('PopoverContent', () => {
  it('renders when popover is open', () => {
    render(
      <Popover open>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent>Popover content</PopoverContent>
      </Popover>
    );
    expect(screen.getByText('Popover content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <Popover open>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent className="custom-class">Content</PopoverContent>
      </Popover>
    );
    expect(screen.getByText('Content').closest('[data-radix-popper-content-wrapper]')?.firstChild).toHaveClass('custom-class');
  });

  it('forwards ref', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Popover open>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent ref={ref}>Content</PopoverContent>
      </Popover>
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('applies default styles', () => {
    render(
      <Popover open>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent data-testid="content">Content</PopoverContent>
      </Popover>
    );
    expect(screen.getByTestId('content')).toHaveClass('bg-popover', 'text-popover-foreground');
  });

  it('accepts align prop', () => {
    render(
      <Popover open>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent align="start">Content</PopoverContent>
      </Popover>
    );
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('accepts sideOffset prop', () => {
    render(
      <Popover open>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent sideOffset={10}>Content</PopoverContent>
      </Popover>
    );
    expect(screen.getByText('Content')).toBeInTheDocument();
  });
});

describe('PopoverAnchor', () => {
  it('renders anchor element', () => {
    render(
      <Popover>
        <PopoverAnchor data-testid="anchor">Anchor</PopoverAnchor>
        <PopoverTrigger>Open</PopoverTrigger>
      </Popover>
    );
    expect(screen.getByTestId('anchor')).toBeInTheDocument();
  });

  it('renders asChild', () => {
    render(
      <Popover>
        <PopoverAnchor asChild>
          <div data-testid="custom-anchor">Custom Anchor</div>
        </PopoverAnchor>
        <PopoverTrigger>Open</PopoverTrigger>
      </Popover>
    );
    expect(screen.getByTestId('custom-anchor')).toBeInTheDocument();
  });
});
