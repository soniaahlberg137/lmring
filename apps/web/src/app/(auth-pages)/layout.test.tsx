import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import AuthPagesLayout from './layout';

describe('AuthPagesLayout', () => {
  it('should render children', async () => {
    const tree = await AuthPagesLayout({
      children: <div data-testid="auth-content">Auth Content</div>,
    });

    render(tree);

    expect(screen.getByTestId('auth-content')).toBeInTheDocument();
    expect(screen.getByText('Auth Content')).toBeInTheDocument();
  });

  it('should center content with flex', async () => {
    const tree = await AuthPagesLayout({ children: <div>Auth Form</div> });
    const { container } = render(tree);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('flex');
    expect(wrapper).toHaveClass('min-h-screen');
    expect(wrapper).toHaveClass('items-center');
    expect(wrapper).toHaveClass('justify-center');
  });
});
