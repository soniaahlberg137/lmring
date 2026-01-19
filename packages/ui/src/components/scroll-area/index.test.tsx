import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { ScrollArea, ScrollBar } from './index';

describe('ScrollArea', () => {
  it('renders with children', () => {
    render(
      <ScrollArea>
        <div data-testid="content">Scrollable content</div>
      </ScrollArea>
    );
    expect(screen.getByTestId('content')).toBeInTheDocument();
  });

  it('forwards ref', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <ScrollArea ref={ref} data-testid="scroll-area">
        Content
      </ScrollArea>
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('applies custom className', () => {
    render(
      <ScrollArea className="custom-class" data-testid="scroll-area">
        Content
      </ScrollArea>
    );
    expect(screen.getByTestId('scroll-area')).toHaveClass('custom-class');
  });

  it('applies default styles', () => {
    render(
      <ScrollArea data-testid="scroll-area">
        Content
      </ScrollArea>
    );
    expect(screen.getByTestId('scroll-area')).toHaveClass('relative', 'overflow-hidden');
  });

  it('renders viewport with content', () => {
    const { container } = render(
      <ScrollArea>
        <p>Long content here</p>
      </ScrollArea>
    );
    const viewport = container.querySelector('[data-radix-scroll-area-viewport]');
    expect(viewport).toBeInTheDocument();
  });
});

describe('ScrollBar', () => {
  it('renders within ScrollArea', () => {
    const { container } = render(
      <ScrollArea>
        <ScrollBar />
        Content
      </ScrollArea>
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it('accepts orientation prop', () => {
    const { container } = render(
      <ScrollArea>
        <ScrollBar orientation="horizontal" />
        Content
      </ScrollArea>
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it('accepts className prop', () => {
    const { container } = render(
      <ScrollArea>
        <ScrollBar className="custom-scrollbar" />
        Content
      </ScrollArea>
    );
    expect(container.firstChild).toBeInTheDocument();
  });
});
