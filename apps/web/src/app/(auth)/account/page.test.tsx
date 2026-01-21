import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AccountPage from './page';

vi.mock('@/hooks/use-translations', () => ({
  useTranslations: () => (key: string) => key,
}));

const { useSessionMock } = vi.hoisted(() => ({ useSessionMock: vi.fn() }));
vi.mock('@/libs/AuthClient', () => ({
  useSession: () => useSessionMock(),
}));

describe('AccountPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('renders loading state', () => {
    useSessionMock.mockReturnValue({ data: null, isPending: true, error: null });

    render(<AccountPage />);
    expect(screen.getByText('Account.loading')).toBeInTheDocument();
  });

  it('renders error state when session is missing', () => {
    useSessionMock.mockReturnValue({ data: null, isPending: false, error: null });

    render(<AccountPage />);
    expect(screen.getByText('Account.error')).toBeInTheDocument();
  });

  it('renders user details and save feedback', async () => {
    useSessionMock.mockReturnValue({
      data: {
        user: {
          id: 'user-1234567890abcdef',
          name: 'Test User',
          email: 'test@example.com',
          image: null,
          createdAt: new Date('2024-01-01T00:00:00.000Z').toISOString(),
          updatedAt: new Date('2024-01-01T00:00:00.000Z').toISOString(),
        },
      },
      isPending: false,
      error: null,
    });

    vi.useFakeTimers();
    render(<AccountPage />);

    expect(screen.getByText('Account.title')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Account.profile_save' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Account.profile_save' }));
    expect(screen.getByRole('button', { name: 'Account.profile_saved' })).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByRole('button', { name: 'Account.profile_save' })).toBeInTheDocument();
  });
});
