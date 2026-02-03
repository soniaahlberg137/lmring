import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  mockGetVote: vi.fn(),
  mockSetHoveredVote: vi.fn(),
  mockSubmitVote: vi.fn(),
  mockT: vi.fn((_key: string, defaultValue: string) => defaultValue),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: mocks.mockT }),
}));

vi.mock('@/stores/vote-store', () => ({
  useVoteStore: () => ({
    getVote: mocks.mockGetVote,
    setHoveredVote: mocks.mockSetHoveredVote,
    submitVote: mocks.mockSubmitVote,
    isSubmitting: false,
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { act, renderHook } from '@testing-library/react';
import { useCardVoting, VoteBar } from './vote-bar';

const defaultProps = {
  messageId: 'msg-1',
  modelResponses: [
    { id: 'resp-1', modelName: 'GPT-4', providerName: 'OpenAI' },
    { id: 'resp-2', modelName: 'Claude', providerName: 'Anthropic' },
  ],
  comparisonType: 'text' as const,
};

describe('VoteBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockGetVote.mockReturnValue(null);
    mocks.mockSubmitVote.mockResolvedValue(true);
  });

  afterEach(() => {
    cleanup();
  });

  it('should render nothing when voting is disabled', () => {
    const { container } = render(<VoteBar {...defaultProps} />);
    expect(container.firstChild).toBeNull();
  });
});

describe('useCardVoting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockGetVote.mockReturnValue(null);
    mocks.mockSubmitVote.mockResolvedValue(true);
  });

  it('should return voting handlers (no-op when disabled)', () => {
    const { result } = renderHook(() => useCardVoting('msg-1', 'text', ['resp-1', 'resp-2']));

    expect(result.current.handleCardClick).toBeDefined();
    expect(result.current.handleCardHover).toBeDefined();
    expect(result.current.handleCardHoverLeave).toBeDefined();
    expect(result.current.isVoted).toBe(false);
    expect(result.current.isSubmitting).toBe(false);
  });

  it('should not submit vote when voting is disabled', async () => {
    const { result } = renderHook(() => useCardVoting('msg-1', 'text', ['resp-1', 'resp-2']));

    await act(async () => {
      await result.current.handleCardClick('resp-1');
    });

    expect(mocks.mockSubmitVote).not.toHaveBeenCalled();
  });

  it('should not set hovered vote when voting is disabled', () => {
    const { result } = renderHook(() => useCardVoting('msg-1', 'text', ['resp-1', 'resp-2']));

    act(() => {
      result.current.handleCardHover('resp-1');
    });

    expect(mocks.mockSetHoveredVote).not.toHaveBeenCalled();
  });

  it('should not clear hovered vote when voting is disabled', () => {
    const { result } = renderHook(() => useCardVoting('msg-1', 'text', ['resp-1', 'resp-2']));

    act(() => {
      result.current.handleCardHoverLeave();
    });

    expect(mocks.mockSetHoveredVote).not.toHaveBeenCalled();
  });
});
