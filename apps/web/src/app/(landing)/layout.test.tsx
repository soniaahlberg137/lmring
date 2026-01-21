import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import LandingLayout from './layout';

describe('LandingLayout', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render children', () => {
    render(
      <LandingLayout>
        <div data-testid="landing-content">Landing Content</div>
      </LandingLayout>,
    );

    expect(screen.getByTestId('landing-content')).toBeInTheDocument();
    expect(screen.getByText('Landing Content')).toBeInTheDocument();
  });

  it('should have flex column layout', () => {
    const { container } = render(
      <LandingLayout>
        <div>Content</div>
      </LandingLayout>,
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('flex');
    expect(wrapper).toHaveClass('h-screen');
    expect(wrapper).toHaveClass('flex-col');
    expect(wrapper).toHaveClass('overflow-y-auto');
  });

  it('should have scrollbar styling classes', () => {
    const { container } = render(
      <LandingLayout>
        <div>Content</div>
      </LandingLayout>,
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('scrollbar-thin');
  });

  it('should wrap children in main element', () => {
    render(
      <LandingLayout>
        <div data-testid="child">Child</div>
      </LandingLayout>,
    );

    const mainElements = screen.getAllByRole('main');
    const main = mainElements[0] as HTMLElement;
    expect(main).toBeInTheDocument();
    expect(main).toHaveClass('flex-1');
    expect(within(main).getByTestId('child')).toBeInTheDocument();
  });
});
