import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/components/sidebar-server', () => ({
  SidebarServer: () => <div data-testid="sidebar-server">SidebarServer</div>,
}));

vi.mock('@/components/sidebar-skeleton', () => ({
  SidebarSkeleton: () => <div data-testid="sidebar-skeleton" />,
}));

vi.mock('@/providers/authed-client-providers', () => ({
  AuthedClientProviders: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="authed-client-providers">{children}</div>
  ),
}));

const redirectMock = vi.fn();
vi.mock('next/navigation', () => ({
  redirect: (...args: unknown[]) => {
    redirectMock(...args);
    throw new Error('NEXT_REDIRECT');
  },
}));

const getCachedUserMock = vi.fn();
vi.mock('@/libs/get-cached-user', () => ({
  getCachedUser: () => getCachedUserMock(),
}));

describe('AuthLayout', () => {
  afterEach(() => {
    cleanup();
    redirectMock.mockReset();
    getCachedUserMock.mockReset();
  });

  it('should render children inside the layout shell', async () => {
    getCachedUserMock.mockResolvedValue({
      name: 'test',
      email: 't@example.com',
      image: 'x',
    });
    const { default: AuthLayout } = await import('./layout');
    render(await AuthLayout({ children: <div>Protected Content</div> }));

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should wrap content in AuthedClientProviders', async () => {
    getCachedUserMock.mockResolvedValue({
      name: 'test',
      email: 't@example.com',
      image: 'x',
    });
    const { default: AuthLayout } = await import('./layout');
    render(await AuthLayout({ children: <div>Content</div> }));

    expect(screen.getByTestId('authed-client-providers')).toBeInTheDocument();
  });

  it('should mount SidebarServer inside the Suspense boundary', async () => {
    getCachedUserMock.mockResolvedValue({
      name: 'test',
      email: 't@example.com',
      image: 'x',
    });
    const { default: AuthLayout } = await import('./layout');
    render(await AuthLayout({ children: <div>Content</div> }));

    expect(screen.getByTestId('sidebar-server')).toBeInTheDocument();
  });

  it('should redirect to /sign-in when no user', async () => {
    getCachedUserMock.mockResolvedValue(null);
    const { default: AuthLayout } = await import('./layout');

    await expect(AuthLayout({ children: <div>Content</div> })).rejects.toThrow('NEXT_REDIRECT');
    expect(redirectMock).toHaveBeenCalledWith('/sign-in');
  });
});
