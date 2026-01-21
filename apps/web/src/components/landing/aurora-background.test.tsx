import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { AuroraBackground } from './aurora-background';

describe('AuroraBackground', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render children', () => {
    render(
      <AuroraBackground>
        <p>Test Content</p>
      </AuroraBackground>,
    );
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(<AuroraBackground className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('should show radial gradient by default', () => {
    const { container } = render(<AuroraBackground />);
    const gradientMask = container.querySelector('[class*="mask-image"]');
    expect(gradientMask).toBeInTheDocument();
  });

  it('should hide radial gradient when showRadialGradient is false', () => {
    const { container } = render(<AuroraBackground showRadialGradient={false} />);
    const allDivs = container.querySelectorAll('div');
    const gradientMaskDiv = Array.from(allDivs).find((div) => div.className.includes('mask-image'));
    expect(gradientMaskDiv).toBeUndefined();
  });

  it('should have base background classes', () => {
    const { container } = render(<AuroraBackground />);
    expect(container.firstChild).toHaveClass('bg-slate-900');
    expect(container.firstChild).toHaveClass('relative');
  });

  it('should render multiple children', () => {
    render(
      <AuroraBackground>
        <div data-testid="child-1">First</div>
        <div data-testid="child-2">Second</div>
      </AuroraBackground>,
    );
    expect(screen.getByTestId('child-1')).toBeInTheDocument();
    expect(screen.getByTestId('child-2')).toBeInTheDocument();
  });
});
