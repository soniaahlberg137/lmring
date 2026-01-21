import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ArenaLayout } from './arena-layout';

describe('ArenaLayout', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render children', () => {
    render(
      <ArenaLayout>
        <div data-testid="child">Child content</div>
      </ArenaLayout>,
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('should render the header with title', () => {
    render(
      <ArenaLayout>
        <div>Content</div>
      </ArenaLayout>,
    );

    expect(screen.getByText('LLM Ring')).toBeInTheDocument();
  });

  it('should render the subtitle', () => {
    render(
      <ArenaLayout>
        <div>Content</div>
      </ArenaLayout>,
    );

    expect(screen.getByText('Compare AI models side by side')).toBeInTheDocument();
  });

  it('should have proper layout structure', () => {
    const { container } = render(
      <ArenaLayout>
        <div>Content</div>
      </ArenaLayout>,
    );

    const mainContainer = container.firstChild as HTMLElement;
    expect(mainContainer).toHaveClass('flex', 'flex-col', 'h-full');
  });

  it('should render multiple children', () => {
    render(
      <ArenaLayout>
        <div data-testid="child-1">First</div>
        <div data-testid="child-2">Second</div>
        <div data-testid="child-3">Third</div>
      </ArenaLayout>,
    );

    expect(screen.getByTestId('child-1')).toBeInTheDocument();
    expect(screen.getByTestId('child-2')).toBeInTheDocument();
    expect(screen.getByTestId('child-3')).toBeInTheDocument();
  });
});
