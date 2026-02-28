import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from './theme-provider';

const setThemeMock = vi.fn();
const fetchMock = vi.fn();

vi.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'system',
    resolvedTheme: 'light',
    setTheme: setThemeMock,
  }),
  ThemeProvider: ({ children, ...props }: { children: React.ReactNode }) => (
    <div data-testid="theme-provider" data-props={JSON.stringify(props)}>
      {children}
    </div>
  ),
}));

describe('ThemeProvider', () => {
  beforeEach(() => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ themeConfig: null, updatedAt: null }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
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
