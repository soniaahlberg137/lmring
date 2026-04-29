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

describe('AuthLayout', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render children inside the layout shell', async () => {
    const { default: AuthLayout } = await import('./layout');
    render(AuthLayout({ children: <div>Protected Content</div> }));

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should wrap content in AuthedClientProviders', async () => {
    const { default: AuthLayout } = await import('./layout');
    render(AuthLayout({ children: <div>Content</div> }));

    expect(screen.getByTestId('authed-client-providers')).toBeInTheDocument();
  });

  it('should mount SidebarServer inside the Suspense boundary', async () => {
    const { default: AuthLayout } = await import('./layout');
    render(AuthLayout({ children: <div>Content</div> }));

    expect(screen.getByTestId('sidebar-server')).toBeInTheDocument();
  });
});
