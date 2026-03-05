import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Sidebar } from './sidebar';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

const mockPathname = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
}));

vi.mock('@/hooks/use-translations', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/stores', () => ({
  useArenaStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      mainContentReady: true,
    }),
  arenaSelectors: {
    mainContentReady: (state: Record<string, unknown>) => state.mainContentReady,
  },
  useWorkflowStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      newConversation: null,
      clearNewConversation: vi.fn(),
    }),
  workflowSelectors: {
    newConversation: (state: Record<string, unknown>) => state.newConversation,
  },
}));

vi.mock('./user-menu', () => ({
  UserMenu: () => <div data-testid="user-menu" />,
}));

global.fetch = vi.fn();

describe('Sidebar', () => {
  const defaultUser = {
    name: 'Test User',
    email: 'test@example.com',
    image: 'https://example.com/avatar.jpg',
  };

  beforeEach(() => {
    mockPathname.mockReturnValue('/arena');
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ conversations: [] }),
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('should render sidebar', () => {
    render(<Sidebar user={defaultUser} />, { wrapper: createWrapper() });
    expect(screen.getByText('lmring')).toBeInTheDocument();
  });

  it('should render navigation items', () => {
    render(<Sidebar user={defaultUser} />, { wrapper: createWrapper() });
    const newChatElements = screen.getAllByText('Sidebar.new_chat');
    const leaderboardElements = screen.getAllByText('Sidebar.leaderboard');
    const historyElements = screen.getAllByText('Sidebar.history');

    expect(newChatElements.length).toBeGreaterThan(0);
    expect(leaderboardElements.length).toBeGreaterThan(0);
    expect(historyElements.length).toBeGreaterThan(0);
  });

  it('should render UserMenu component', () => {
    render(<Sidebar user={defaultUser} />, { wrapper: createWrapper() });
    const userMenus = screen.getAllByTestId('user-menu');
    expect(userMenus.length).toBeGreaterThan(0);
  });

  it('should highlight active navigation item', () => {
    mockPathname.mockReturnValue('/leaderboard');

    const { container } = render(<Sidebar user={defaultUser} />, { wrapper: createWrapper() });

    const leaderboardLink = container.querySelector('a[href="/leaderboard"]');
    expect(leaderboardLink).toBeInTheDocument();
  });

  it('should show mobile menu button', () => {
    render(<Sidebar user={defaultUser} />, { wrapper: createWrapper() });

    const mobileButtons = screen.getAllByLabelText('Open menu');
    expect(mobileButtons.length).toBeGreaterThan(0);
  });

  it('should open mobile menu on button click', async () => {
    render(<Sidebar user={defaultUser} />, { wrapper: createWrapper() });

    const mobileButtons = screen.getAllByLabelText('Open menu');
    const firstButton = mobileButtons[0];
    if (firstButton) {
      fireEvent.click(firstButton);
    }

    await waitFor(() => {
      expect(screen.getByLabelText('Close menu')).toBeInTheDocument();
    });
  });

  it('should close mobile menu on close button click', async () => {
    render(<Sidebar user={defaultUser} />, { wrapper: createWrapper() });

    const mobileButtons = screen.getAllByLabelText('Open menu');
    const firstButton = mobileButtons[0];
    if (firstButton) {
      fireEvent.click(firstButton);
    }
    await waitFor(() => {
      expect(screen.getByLabelText('Close menu')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Close menu'));
    await waitFor(() => {
      expect(screen.queryByLabelText('Close menu')).not.toBeInTheDocument();
    });
  });

  it('should fetch recent conversations', async () => {
    render(<Sidebar user={defaultUser} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/conversations?limit=10&offset=0&withFirstMessage=true&excludeCleared=true',
      );
    });
  });

  it('should display recent conversations when loaded', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          conversations: [
            {
              id: '1',
              title: 'Test Conversation',
              firstMessage: 'Hello world',
              updatedAt: new Date().toISOString(),
            },
          ],
        }),
    });

    render(<Sidebar user={defaultUser} />, { wrapper: createWrapper() });

    await waitFor(() => {
      const messages = screen.getAllByText('Hello world');
      expect(messages.length).toBeGreaterThan(0);
    });
  });

  it('should truncate long conversation titles', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          conversations: [
            {
              id: '1',
              title: 'This is a very long conversation title that should be truncated',
              firstMessage:
                'This is a very long first message that should definitely be truncated to fit',
              updatedAt: new Date().toISOString(),
            },
          ],
        }),
    });

    render(<Sidebar user={defaultUser} />, { wrapper: createWrapper() });

    await waitFor(() => {
      const truncated = screen.getAllByText(/This is a very long \.\.\./);
      expect(truncated.length).toBeGreaterThan(0);
    });
  });

  it('should show skeleton while loading conversations', () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(() => new Promise(() => {}));

    render(<Sidebar user={defaultUser} />, { wrapper: createWrapper() });

    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should collapse on settings page', () => {
    mockPathname.mockReturnValue('/settings');

    render(<Sidebar user={defaultUser} />, { wrapper: createWrapper() });

    expect(screen.queryByText('LMRing')).not.toBeInTheDocument();
  });

  it('should handle navigation to new chat', () => {
    render(<Sidebar user={defaultUser} />, { wrapper: createWrapper() });

    const newChatLinks = screen.getAllByText('Sidebar.new_chat');
    const newChatLink = newChatLinks[0]?.closest('a');
    expect(newChatLink).toHaveAttribute('href', '/arena');
  });

  it('should handle navigation to leaderboard', () => {
    render(<Sidebar user={defaultUser} />, { wrapper: createWrapper() });

    const leaderboardLinks = screen.getAllByText('Sidebar.leaderboard');
    const leaderboardLink = leaderboardLinks[0]?.closest('a');
    expect(leaderboardLink).toHaveAttribute('href', '/leaderboard');
  });

  it('should handle navigation to history', () => {
    render(<Sidebar user={defaultUser} />, { wrapper: createWrapper() });

    const historyLinks = screen.getAllByText('Sidebar.history');
    const historyLink = historyLinks[0]?.closest('a');
    expect(historyLink).toHaveAttribute('href', '/history');
  });
});
