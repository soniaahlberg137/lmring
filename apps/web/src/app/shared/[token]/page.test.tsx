import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SharedConversationPage from './page';

// The page uses useQuery, so tests render it inside a QueryClientProvider.
// retryDelay: 0 keeps the error-path retries instant.
const renderPage = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retryDelay: 0 } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <SharedConversationPage />
    </QueryClientProvider>,
  );
};

const { useParamsMock } = vi.hoisted(() => ({
  useParamsMock: vi.fn(() => ({ token: 'token-123' })),
}));

vi.mock('next/navigation', () => ({
  useParams: () => useParamsMock(),
}));

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('next/image', () => ({
  // biome-ignore lint/performance/noImgElement: Mock for next/image in tests
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

vi.mock('@/components/arena/provider-icon', () => ({
  ProviderIcon: ({ providerId }: { providerId: string }) => (
    <span data-testid="provider-icon">{providerId}</span>
  ),
}));

describe('SharedConversationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders loading UI while fetching', () => {
    global.fetch = vi.fn(() => new Promise(() => {})) as unknown as typeof fetch;

    renderPage();
    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
  });

  it('renders not found state for 404', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 404 }) as unknown as typeof fetch;

    renderPage();
    expect(await screen.findByText('Conversation Not Found')).toBeInTheDocument();
  });

  it('renders expired state for 410', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 410 }) as unknown as typeof fetch;

    renderPage();
    expect(await screen.findByText('Link Expired')).toBeInTheDocument();
  });

  it('renders error state for non-ok response', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 }) as unknown as typeof fetch;

    renderPage();
    expect(await screen.findByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders conversation with model badges and vote styling', async () => {
    vi.spyOn(Date.prototype, 'toLocaleDateString').mockReturnValue('formatted-date');

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          conversation: {
            id: 'c1',
            title: 'My Conversation',
            createdAt: new Date('2024-01-01T00:00:00.000Z').toISOString(),
          },
          user: { name: 'Alice', avatarUrl: null },
          messages: [
            {
              id: 'm1',
              role: 'user',
              content: 'Hello',
              createdAt: new Date('2024-01-01T00:00:00.000Z').toISOString(),
              voteInfo: {
                voteResults: [{ modelName: 'gpt-4o', providerName: 'openai', outcome: 'winner' }],
              },
              responses: [
                {
                  id: 'r1',
                  modelName: 'gpt-4o',
                  providerName: 'openai',
                  responseContent: 'Hi!',
                  tokensUsed: 10,
                  responseTimeMs: 42,
                  displayPosition: 0,
                  createdAt: new Date('2024-01-01T00:00:01.000Z').toISOString(),
                },
              ],
            },
          ],
        }),
    }) as unknown as typeof fetch;

    renderPage();

    expect(await screen.findByText('My Conversation')).toBeInTheDocument();
    expect(screen.getByText('formatted-date')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByTestId('response-viewer')).toHaveTextContent('Hi!');

    const modelNameNodes = screen.getAllByText('gpt-4o');
    const headerBadge = modelNameNodes
      .map((node) => node.parentElement)
      .find((el) => el?.className.includes('border-amber-500/50'));

    expect(headerBadge).toBeTruthy();
  });

  it('renders fallback when conversation has no user turns', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          conversation: {
            id: 'c1',
            title: 'Empty Conversation',
            createdAt: new Date('2024-01-01T00:00:00.000Z').toISOString(),
          },
          user: { name: null, avatarUrl: null },
          messages: [
            {
              id: 'm1',
              role: 'user',
              content: 'No responses',
              createdAt: new Date().toISOString(),
            },
          ],
        }),
    }) as unknown as typeof fetch;

    renderPage();
    await waitFor(() => {
      expect(screen.getByText('No conversation content available')).toBeInTheDocument();
    });
  });
});
