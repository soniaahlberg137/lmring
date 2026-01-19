import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './index';

describe('Tooltip', () => {
  it('renders trigger', () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent>Tooltip text</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
    expect(screen.getByText('Hover me')).toBeInTheDocument();
  });

  it('renders with open prop', () => {
    render(
      <TooltipProvider>
        <Tooltip open>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent>Tooltip text</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
    expect(screen.getByText('Hover me')).toBeInTheDocument();
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });
});

describe('TooltipTrigger', () => {
  it('renders as button by default', () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Trigger</TooltipTrigger>
        </Tooltip>
      </TooltipProvider>
    );
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('renders asChild', () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span data-testid="custom-trigger">Custom</span>
          </TooltipTrigger>
        </Tooltip>
      </TooltipProvider>
    );
    expect(screen.getByTestId('custom-trigger')).toBeInTheDocument();
  });
});

describe('TooltipContent', () => {
  it('renders when tooltip is open', () => {
    render(
      <TooltipProvider>
        <Tooltip open>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent>Content here</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
    expect(screen.getByRole('tooltip')).toHaveTextContent('Content here');
  });

  it('applies custom className', () => {
    render(
      <TooltipProvider>
        <Tooltip open>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent className="custom-class" data-testid="tooltip-content">Content</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
    expect(screen.getByTestId('tooltip-content')).toHaveClass('custom-class');
  });

  it('forwards ref', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <TooltipProvider>
        <Tooltip open>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent ref={ref}>Content</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('applies default styles', () => {
    render(
      <TooltipProvider>
        <Tooltip open>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent data-testid="tooltip-content">Content</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
    expect(screen.getByTestId('tooltip-content')).toHaveClass('bg-popover', 'text-popover-foreground');
  });

  it('accepts sideOffset prop', () => {
    render(
      <TooltipProvider>
        <Tooltip open>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent sideOffset={10}>Content</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });
});

describe('TooltipProvider', () => {
  it('provides context to children', () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Test</TooltipTrigger>
        </Tooltip>
      </TooltipProvider>
    );
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('accepts delayDuration prop', () => {
    render(
      <TooltipProvider delayDuration={500}>
        <Tooltip>
          <TooltipTrigger>Test</TooltipTrigger>
        </Tooltip>
      </TooltipProvider>
    );
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
