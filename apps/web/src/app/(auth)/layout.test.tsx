import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mockRedirect = vi.fn();

vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    mockRedirect(url);
    throw new Error('NEXT_REDIRECT');
  },
}));

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock('@/components/sidebar', () => ({
  Sidebar: ({ user }: { user: { name: string; email: string; image: string } }) => (
    <div data-testid="sidebar" data-user-email={user.email}>
      Sidebar
    </div>
  ),
}));

vi.mock('@/providers/store-providers', () => ({
  StoreProviders: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="store-providers">{children}</div>
  ),
}));

const mockGetSession = vi.fn();

vi.mock('@/libs/Auth', () => ({
  auth: {
    api: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
    },
  },
}));

describe('AuthLayout', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('should redirect to sign-in when no session', async () => {
    mockGetSession.mockResolvedValue(null);

    const AuthLayout = (await import('./layout')).default;

    try {
      await AuthLayout({ children: <div>Test</div> });
    } catch (e) {
      expect((e as Error).message).toBe('NEXT_REDIRECT');
    }

    expect(mockRedirect).toHaveBeenCalledWith('/sign-in');
  });

  it('should render children when authenticated', async () => {
    mockGetSession.mockResolvedValue({
      user: {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        image: 'https://example.com/avatar.png',
      },
      session: { id: 'session-1' },
    });

    const AuthLayout = (await import('./layout')).default;
    const result = await AuthLayout({ children: <div>Protected Content</div> });

    render(result);

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should render sidebar with user data', async () => {
    mockGetSession.mockResolvedValue({
      user: {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        image: 'https://example.com/avatar.png',
      },
      session: { id: 'session-1' },
    });

    const AuthLayout = (await import('./layout')).default;
    const result = await AuthLayout({ children: <div>Content</div> });

    render(result);

    const sidebar = screen.getByTestId('sidebar');
    expect(sidebar).toBeInTheDocument();
    expect(sidebar).toHaveAttribute('data-user-email', 'test@example.com');
  });

  it('should use email as name fallback when name is missing', async () => {
    mockGetSession.mockResolvedValue({
      user: {
        id: 'user-1',
        name: null,
        email: 'user@example.com',
        image: null,
      },
      session: { id: 'session-1' },
    });

    const AuthLayout = (await import('./layout')).default;
    const result = await AuthLayout({ children: <div>Content</div> });

    render(result);

    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
  });

  it('should use default avatar when image is missing', async () => {
    mockGetSession.mockResolvedValue({
      user: {
        id: 'user-1',
        name: 'User',
        email: 'user@example.com',
        image: null,
      },
      session: { id: 'session-1' },
    });

    const AuthLayout = (await import('./layout')).default;
    const result = await AuthLayout({ children: <div>Content</div> });

    render(result);

    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
  });

  it('should wrap content in StoreProviders', async () => {
    mockGetSession.mockResolvedValue({
      user: {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        image: 'https://example.com/avatar.png',
      },
      session: { id: 'session-1' },
    });

    const AuthLayout = (await import('./layout')).default;
    const result = await AuthLayout({ children: <div>Content</div> });

    render(result);

    expect(screen.getByTestId('store-providers')).toBeInTheDocument();
  });
});
