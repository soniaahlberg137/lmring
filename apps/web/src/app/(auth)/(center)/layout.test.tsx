import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import CenteredLayout from './layout';

describe('CenteredLayout', () => {
  it('should render children', async () => {
    const tree = await CenteredLayout({
      children: <div data-testid="child-content">Test Content</div>,
    });
    render(tree);

    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should center content with flex', async () => {
    const tree = await CenteredLayout({ children: <div>Centered Content</div> });
    const { container } = render(tree);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('flex');
    expect(wrapper).toHaveClass('min-h-screen');
    expect(wrapper).toHaveClass('items-center');
    expect(wrapper).toHaveClass('justify-center');
  });
});
