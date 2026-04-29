import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/components/sidebar', () => ({
  Sidebar: ({ user }: { user?: { name: string } }) => (
    <div data-testid="sidebar" data-user-name={user?.name ?? 'no-user'} />
  ),
}));

const getCachedUserMock = vi.fn();
vi.mock('@/libs/get-cached-user', () => ({
  getCachedUser: getCachedUserMock,
}));

beforeEach(() => {
  getCachedUserMock.mockReset();
});

describe('SidebarServer', () => {
  it('passes undefined user to Sidebar when getCachedUser returns null', async () => {
    getCachedUserMock.mockResolvedValue(null);
    const { SidebarServer } = await import('./sidebar-server');
    const ui = await SidebarServer();
    const { getByTestId } = render(ui);
    expect(getByTestId('sidebar').getAttribute('data-user-name')).toBe('no-user');
  });

  it('passes mapped user to Sidebar when authenticated', async () => {
    getCachedUserMock.mockResolvedValue({
      name: 'Alice',
      email: 'a@x.com',
      image: 'https://img/a.png',
    });
    const { SidebarServer } = await import('./sidebar-server');
    const ui = await SidebarServer();
    const { getByTestId } = render(ui);
    expect(getByTestId('sidebar').getAttribute('data-user-name')).toBe('Alice');
  });
});
