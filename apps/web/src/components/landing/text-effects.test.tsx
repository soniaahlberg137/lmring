import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

describe('TextGradient', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render children', async () => {
    const { TextGradient } = await import('./text-effects');
    render(<TextGradient>Gradient Text</TextGradient>);
    expect(screen.getByText('Gradient Text')).toBeInTheDocument();
  });

  it('should apply custom className', async () => {
    const { TextGradient } = await import('./text-effects');
    render(<TextGradient className="custom-gradient">Text</TextGradient>);
    expect(screen.getByText('Text')).toHaveClass('custom-gradient');
  });

  it('should render static gradient by default', async () => {
    const { TextGradient } = await import('./text-effects');
    const { container } = render(<TextGradient>Static</TextGradient>);
    expect(container.querySelector('span')).toBeInTheDocument();
  });

  it('should render animated gradient when animate is true', async () => {
    const { TextGradient } = await import('./text-effects');
    const { container } = render(<TextGradient animate>Animated</TextGradient>);
    expect(container.querySelector('span')).toBeInTheDocument();
  });
});

describe('TextShimmer', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render children', async () => {
    const { TextShimmer } = await import('./text-effects');
    render(<TextShimmer>Shimmer Text</TextShimmer>);
    expect(screen.getByText('Shimmer Text')).toBeInTheDocument();
  });

  it('should apply custom className', async () => {
    const { TextShimmer } = await import('./text-effects');
    render(<TextShimmer className="shimmer-custom">Shimmer</TextShimmer>);
    expect(screen.getByText('Shimmer')).toHaveClass('shimmer-custom');
  });
});

describe('HighlightText', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render children', async () => {
    const { HighlightText } = await import('./text-effects');
    render(<HighlightText>Highlighted</HighlightText>);
    expect(screen.getByText('Highlighted')).toBeInTheDocument();
  });

  it('should apply custom className', async () => {
    const { HighlightText } = await import('./text-effects');
    const { container } = render(<HighlightText className="highlight-custom">Text</HighlightText>);
    expect(container.firstChild).toHaveClass('highlight-custom');
  });

  it('should apply highlightClassName to background', async () => {
    const { HighlightText } = await import('./text-effects');
    const { container } = render(
      <HighlightText highlightClassName="bg-red-500">Highlight</HighlightText>,
    );
    const highlightBg = container.querySelector('.bg-red-500');
    expect(highlightBg).toBeInTheDocument();
  });
});

describe('Typewriter', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render all characters of the text', async () => {
    const { Typewriter } = await import('./text-effects');
    render(<Typewriter text="Hello" />);
    expect(screen.getByText('H')).toBeInTheDocument();
    expect(screen.getByText('e')).toBeInTheDocument();
    expect(screen.getByText('l', { selector: 'span span:nth-child(3)' })).toBeInTheDocument();
    expect(screen.getByText('o')).toBeInTheDocument();
  });

  it('should apply custom className', async () => {
    const { Typewriter } = await import('./text-effects');
    const { container } = render(<Typewriter text="Test" className="typewriter-custom" />);
    expect(container.firstChild).toHaveClass('typewriter-custom');
  });
});

describe('RevealText', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render children', async () => {
    const { RevealText } = await import('./text-effects');
    render(<RevealText>Revealed Content</RevealText>);
    expect(screen.getByText('Revealed Content')).toBeInTheDocument();
  });

  it('should apply custom className', async () => {
    const { RevealText } = await import('./text-effects');
    const { container } = render(<RevealText className="reveal-custom">Text</RevealText>);
    expect(container.firstChild).toHaveClass('reveal-custom');
  });

  it('should have overflow hidden class', async () => {
    const { RevealText } = await import('./text-effects');
    const { container } = render(<RevealText>Hidden Overflow</RevealText>);
    expect(container.firstChild).toHaveClass('overflow-hidden');
  });
});
