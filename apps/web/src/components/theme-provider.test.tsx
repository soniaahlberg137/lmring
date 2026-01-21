import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from './theme-provider';

vi.mock('next-themes', () => ({
  ThemeProvider: ({ children, ...props }: { children: React.ReactNode }) => (
    <div data-testid="theme-provider" data-props={JSON.stringify(props)}>
      {children}
    </div>
  ),
}));

describe('ThemeProvider', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render children', () => {
    render(
      <ThemeProvider>
        <div data-testid="child">Child Content</div>
      </ThemeProvider>,
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Child Content')).toBeInTheDocument();
  });

  it('should pass correct props to NextThemesProvider', () => {
    render(
      <ThemeProvider>
        <div>Content</div>
      </ThemeProvider>,
    );

    const providers = screen.getAllByTestId('theme-provider');
    const provider = providers[0];
    const propsAttr = provider?.getAttribute('data-props') || '{}';
    const props = JSON.parse(propsAttr);

    expect(props.attribute).toBe('class');
    expect(props.defaultTheme).toBe('system');
    expect(props.enableSystem).toBeTruthy();
    expect(props.disableTransitionOnChange).toBeTruthy();
  });
});
