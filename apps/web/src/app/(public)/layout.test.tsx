import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock('@/libs/Auth', () => ({
  auth: {
    api: {
      getSession: vi.fn().mockResolvedValue(null),
    },
  },
}));

vi.mock('@/components/landing', () => ({
  FrostedHeader: ({ rightNav }: { rightNav?: React.ReactNode }) => (
    <header data-testid="frosted-header">{rightNav}</header>
  ),
}));

vi.mock('@/components/user-menu', () => ({
  UserMenu: ({ user }: { user?: { name?: string; email?: string } }) => (
    <div data-testid="user-menu" data-name={user?.name}>
      User Menu
    </div>
  ),
}));

describe('PublicLayout', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('should render children', async () => {
    const { default: PublicLayout } = await import('./layout');
    render(await PublicLayout({ children: <div data-testid="test-child">Content</div> }));

    expect(screen.getByTestId('test-child')).toBeInTheDocument();
  });

  it('should render FrostedHeader', async () => {
    const { default: PublicLayout } = await import('./layout');
    render(await PublicLayout({ children: <div>Content</div> }));

    expect(screen.getByTestId('frosted-header')).toBeInTheDocument();
  });

  it('should not render UserMenu when no session', async () => {
    const { default: PublicLayout } = await import('./layout');
    render(await PublicLayout({ children: <div>Content</div> }));

    expect(screen.queryByTestId('user-menu')).not.toBeInTheDocument();
  });

  it('should render UserMenu when session exists', async () => {
    const { auth } = await import('@/libs/Auth');
    vi.mocked(auth.api.getSession).mockResolvedValueOnce({
      user: {
        id: 'user-1',
        name: 'John Doe',
        email: 'john@example.com',
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        emailVerified: true,
      },
      session: {
        id: 'session-1',
        userId: 'user-1',
        token: 'token',
        expiresAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        ipAddress: null,
        userAgent: null,
      },
    });

    const { default: PublicLayout } = await import('./layout');
    render(await PublicLayout({ children: <div>Content</div> }));

    expect(screen.getByTestId('user-menu')).toBeInTheDocument();
  });

  it('should pass user data to UserMenu', async () => {
    const { auth } = await import('@/libs/Auth');
    vi.mocked(auth.api.getSession).mockResolvedValueOnce({
      user: {
        id: 'user-1',
        name: 'Jane Doe',
        email: 'jane@example.com',
        image: 'https://example.com/avatar.png',
        createdAt: new Date(),
        updatedAt: new Date(),
        emailVerified: true,
      },
      session: {
        id: 'session-1',
        userId: 'user-1',
        token: 'token',
        expiresAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        ipAddress: null,
        userAgent: null,
      },
    });

    const { default: PublicLayout } = await import('./layout');
    render(await PublicLayout({ children: <div>Content</div> }));

    const userMenu = screen.getByTestId('user-menu');
    expect(userMenu).toHaveAttribute('data-name', 'Jane Doe');
  });

  it('should render main element around children', async () => {
    const { default: PublicLayout } = await import('./layout');
    const { container } = render(await PublicLayout({ children: <div>Content</div> }));

    expect(container.querySelector('main')).toBeInTheDocument();
  });
});
