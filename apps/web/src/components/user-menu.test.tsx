import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockSignOut: vi.fn(),
  mockResetConversation: vi.fn(),
  mockSetModelsLastLoadedAt: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mocks.mockPush,
  }),
}));

vi.mock('@/hooks/use-translations', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/libs/AuthClient', () => ({
  authClient: {
    signOut: mocks.mockSignOut,
  },
}));

vi.mock('@/stores', () => ({
  useWorkflowStore: (selector: (state: { resetConversation: () => void }) => unknown) =>
    selector({ resetConversation: mocks.mockResetConversation }),
  useArenaStore: (selector: (state: { setModelsLastLoadedAt: () => void }) => unknown) =>
    selector({ setModelsLastLoadedAt: mocks.mockSetModelsLastLoadedAt }),
}));

describe('UserMenu', () => {
  const defaultUser = {
    name: 'Test User',
    email: 'test@example.com',
    image: 'https://example.com/avatar.jpg',
  };

  beforeEach(() => {
    mocks.mockPush.mockClear();
    mocks.mockSignOut.mockClear();
    mocks.mockSignOut.mockResolvedValue(undefined);
    mocks.mockResetConversation.mockClear();
    mocks.mockSetModelsLastLoadedAt.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it('should render user avatar', async () => {
    const { UserMenu } = await import('./user-menu');
    render(<UserMenu user={defaultUser} />);

    const avatar = screen.getByRole('button');
    expect(avatar).toBeInTheDocument();
  });

  it('should show user name when not collapsed', async () => {
    const { UserMenu } = await import('./user-menu');
    render(<UserMenu user={defaultUser} collapsed={false} />);

    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('should show user email when not collapsed', async () => {
    const { UserMenu } = await import('./user-menu');
    render(<UserMenu user={defaultUser} collapsed={false} />);

    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('should hide user info when collapsed', async () => {
    const { UserMenu } = await import('./user-menu');
    render(<UserMenu user={defaultUser} collapsed={true} />);

    expect(screen.queryByText('Test User')).not.toBeInTheDocument();
    expect(screen.queryByText('test@example.com')).not.toBeInTheDocument();
  });

  it('should show fallback initial when no name provided', async () => {
    const { UserMenu } = await import('./user-menu');
    render(<UserMenu user={{}} />);

    expect(screen.getByText('U')).toBeInTheDocument();
  });

  it('should show first letter of name as fallback', async () => {
    const { UserMenu } = await import('./user-menu');
    render(<UserMenu user={{ name: 'John' }} />);

    expect(screen.getByText('J')).toBeInTheDocument();
  });

  it('should have accessible dropdown trigger', async () => {
    const { UserMenu } = await import('./user-menu');
    render(<UserMenu user={defaultUser} />);

    const trigger = screen.getByRole('button');
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
  });
});
