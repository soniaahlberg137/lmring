import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/utils/AppConfig', () => ({
  AppConfig: {
    name: 'LMRing',
  },
}));

vi.mock('next/image', () => ({
  // biome-ignore lint/a11y/useAltText: test mock for next/image
  // biome-ignore lint/performance/noImgElement: test mock for next/image
  default: (props: React.ComponentProps<'img'>) => <img {...props} />,
}));

describe('FrostedHeader', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render app logo', async () => {
    const { FrostedHeader } = await import('./frosted-header');
    render(<FrostedHeader />);

    const logo = screen.getByAltText('LMRing');
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('src', '/athena-black.svg');
  });

  it('should render app name', async () => {
    const { FrostedHeader } = await import('./frosted-header');
    render(<FrostedHeader />);

    expect(screen.getByText('LMRing')).toBeInTheDocument();
  });

  it('should render rightNav when provided', async () => {
    const { FrostedHeader } = await import('./frosted-header');
    render(<FrostedHeader rightNav={<button type="button">Sign In</button>} />);

    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });

  it('should apply custom className', async () => {
    const { FrostedHeader } = await import('./frosted-header');
    const { container } = render(<FrostedHeader className="custom-class" />);

    const header = container.querySelector('header');
    expect(header?.className).toContain('custom-class');
  });

  it('should render home link', async () => {
    const { FrostedHeader } = await import('./frosted-header');
    render(<FrostedHeader />);

    const homeLink = screen.getByRole('link');
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('should render SVG filter for visual effects', async () => {
    const { FrostedHeader } = await import('./frosted-header');
    const { container } = render(<FrostedHeader />);

    const svgFilter = container.querySelector('#displacementFilter');
    expect(svgFilter).toBeInTheDocument();
  });
});
