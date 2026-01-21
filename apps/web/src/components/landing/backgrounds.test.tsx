import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

describe('GridBackground', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render children', async () => {
    const { GridBackground } = await import('./backgrounds');
    render(
      <GridBackground>
        <p>Grid Content</p>
      </GridBackground>,
    );
    expect(screen.getByText('Grid Content')).toBeInTheDocument();
  });

  it('should apply custom className', async () => {
    const { GridBackground } = await import('./backgrounds');
    const { container } = render(<GridBackground className="grid-custom">Content</GridBackground>);
    expect(container.firstChild).toHaveClass('grid-custom');
  });

  it('should have bg-background class', async () => {
    const { GridBackground } = await import('./backgrounds');
    const { container } = render(<GridBackground>Content</GridBackground>);
    expect(container.firstChild).toHaveClass('bg-background');
  });
});

describe('DotBackground', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render children', async () => {
    const { DotBackground } = await import('./backgrounds');
    render(
      <DotBackground>
        <p>Dot Content</p>
      </DotBackground>,
    );
    expect(screen.getByText('Dot Content')).toBeInTheDocument();
  });

  it('should apply custom className', async () => {
    const { DotBackground } = await import('./backgrounds');
    const { container } = render(<DotBackground className="dot-custom">Content</DotBackground>);
    expect(container.firstChild).toHaveClass('dot-custom');
  });

  it('should apply custom dot color via inline styles', async () => {
    const { DotBackground } = await import('./backgrounds');
    const { container } = render(<DotBackground dotColor="#ff0000">Content</DotBackground>);
    const div = container.firstChild as HTMLElement;
    expect(div.style.backgroundImage).toContain('#ff0000');
  });
});

describe('Beam', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render with default props', async () => {
    const { Beam } = await import('./backgrounds');
    const { container } = render(<Beam />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should apply custom className', async () => {
    const { Beam } = await import('./backgrounds');
    const { container } = render(<Beam className="beam-custom" />);
    expect(container.firstChild).toHaveClass('beam-custom');
  });

  it('should apply top percentage as inline style', async () => {
    const { Beam } = await import('./backgrounds');
    const { container } = render(<Beam top={50} />);
    const div = container.firstChild as HTMLElement;
    expect(div.style.top).toBe('50%');
  });

  it('should apply width as inline style', async () => {
    const { Beam } = await import('./backgrounds');
    const { container } = render(<Beam width={100} />);
    const div = container.firstChild as HTMLElement;
    expect(div.style.width).toBe('100px');
  });
});

describe('BackgroundBeams', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render multiple beams', async () => {
    const { BackgroundBeams } = await import('./backgrounds');
    const { container } = render(<BackgroundBeams />);
    const beams = container.querySelectorAll('[class*="absolute"]');
    expect(beams.length).toBeGreaterThan(0);
  });

  it('should apply custom className', async () => {
    const { BackgroundBeams } = await import('./backgrounds');
    const { container } = render(<BackgroundBeams className="beams-custom" />);
    expect(container.firstChild).toHaveClass('beams-custom');
  });

  it('should have overflow hidden', async () => {
    const { BackgroundBeams } = await import('./backgrounds');
    const { container } = render(<BackgroundBeams />);
    expect(container.firstChild).toHaveClass('overflow-hidden');
  });
});

describe('GradientOrb', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render with default props', async () => {
    const { GradientOrb } = await import('./backgrounds');
    const { container } = render(<GradientOrb />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should apply custom className', async () => {
    const { GradientOrb } = await import('./backgrounds');
    const { container } = render(<GradientOrb className="orb-custom" />);
    expect(container.firstChild).toHaveClass('orb-custom');
  });

  it('should apply custom size', async () => {
    const { GradientOrb } = await import('./backgrounds');
    const { container } = render(<GradientOrb size="200px" />);
    const div = container.firstChild as HTMLElement;
    expect(div.style.width).toBe('200px');
    expect(div.style.height).toBe('200px');
  });

  it('should apply custom blur', async () => {
    const { GradientOrb } = await import('./backgrounds');
    const { container } = render(<GradientOrb blur="50px" />);
    const div = container.firstChild as HTMLElement;
    expect(div.style.filter).toBe('blur(50px)');
  });

  it('should render static when animate is false', async () => {
    const { GradientOrb } = await import('./backgrounds');
    const { container } = render(<GradientOrb animate={false} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should have rounded-full class', async () => {
    const { GradientOrb } = await import('./backgrounds');
    const { container } = render(<GradientOrb />);
    expect(container.firstChild).toHaveClass('rounded-full');
  });
});
