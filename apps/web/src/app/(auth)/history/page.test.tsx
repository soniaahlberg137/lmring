import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import HistoryPage from './page';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('@/hooks/use-translations', () => ({
  useTranslations: () => (key: string) => key,
}));

const { toastMock } = vi.hoisted(() => ({
  toastMock: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));
vi.mock('sonner', () => ({ toast: toastMock }));

const {
  conversationApiMock,
  setMainContentReadyMock,
  setModelsLastLoadedAtMock,
  resetConversationMock,
} = vi.hoisted(() => ({
  conversationApiMock: {
    getConversationsWithModels: vi.fn(),
    shareConversation: vi.fn(),
    deleteConversation: vi.fn(),
    isLoading: false,
  },
  setMainContentReadyMock: vi.fn(),
  setModelsLastLoadedAtMock: vi.fn(),
  resetConversationMock: vi.fn(),
}));

const { mockHistoryConversations, mockIsPending } = vi.hoisted(() => ({
  mockHistoryConversations: { data: [] as unknown[] },
  mockIsPending: { value: false },
}));

vi.mock('@/hooks/use-conversations-query', () => ({
  useHistoryConversations: () => ({
    data: mockHistoryConversations.data,
    isPending: mockIsPending.value,
  }),
  conversationsKeys: {
    all: ['conversations'],
  },
}));

vi.mock('@/hooks/use-conversation', () => ({
  useConversation: () => conversationApiMock,
}));

vi.mock('@/stores', () => ({
  useArenaStore: (
    selector: (state: {
      setMainContentReady: (ready: boolean) => void;
      setModelsLastLoadedAt: (timestamp: number | null) => void;
    }) => unknown,
  ) =>
    selector({
      setMainContentReady: setMainContentReadyMock,
      setModelsLastLoadedAt: setModelsLastLoadedAtMock,
    }),
  useWorkflowStore: (selector: (state: { resetConversation: () => void }) => unknown) =>
    selector({ resetConversation: resetConversationMock }),
}));

vi.mock('@/components/arena/provider-icon', () => ({
  ProviderIcon: ({ providerId }: { providerId: string }) => (
    <span data-testid="provider-icon">{providerId}</span>
  ),
}));

describe('HistoryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock state
    mockIsPending.value = false;
    mockHistoryConversations.data = [];
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
        readText: vi.fn().mockResolvedValue(''),
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders loading skeleton before conversations are loaded', () => {
    mockIsPending.value = true;
    mockHistoryConversations.data = [];

    render(<HistoryPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('conversation-skeleton')).toBeInTheDocument();
  });

  it('renders empty state when no conversations exist', async () => {
    mockIsPending.value = false;
    mockHistoryConversations.data = [];

    render(<HistoryPage />, { wrapper: createWrapper() });
    expect(await screen.findByText('No conversations yet')).toBeInTheDocument();
    expect(setMainContentReadyMock).toHaveBeenCalledWith(true);
  });

  it('shares and deletes a conversation', async () => {
    mockIsPending.value = false;
    mockHistoryConversations.data = [
      {
        id: 'conv-1',
        userId: 'user-1',
        title: 'Conversation 1',
        createdAt: new Date('2024-01-01T00:00:00.000Z').toISOString(),
        updatedAt: new Date('2024-01-02T00:00:00.000Z').toISOString(),
        firstMessage: 'Hello world',
        models: [{ modelName: 'gpt-4o', providerName: 'openai' }],
      },
    ];
    conversationApiMock.shareConversation.mockResolvedValue({
      shareUrl: 'https://example.com/shared/abc',
      expiresAt: new Date('2024-02-01T00:00:00.000Z').toISOString(),
    });
    conversationApiMock.deleteConversation.mockImplementation(async () => {
      // Clear the mock data to simulate deletion
      mockHistoryConversations.data = [];
      return true;
    });

    render(<HistoryPage />, { wrapper: createWrapper() });
    expect(await screen.findByText('Hello world')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'History.share_aria_label' }));
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://example.com/shared/abc');
    });
    expect(toastMock.success).toHaveBeenCalledWith('History.share_success', expect.any(Object));

    fireEvent.click(screen.getByRole('button', { name: 'History.delete_aria_label' }));
    expect(screen.getByTestId('alert-dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'History.delete_dialog_confirm' }));

    await waitFor(() => {
      expect(conversationApiMock.deleteConversation).toHaveBeenCalledWith('conv-1');
    });
    expect(toastMock.success).toHaveBeenCalledWith('History.delete_success');
    await waitFor(() => {
      expect(screen.queryByText('Hello world')).not.toBeInTheDocument();
    });
  });
});
