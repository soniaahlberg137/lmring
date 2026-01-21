import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
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
import { toast } from 'sonner';
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

  it('should render tie and all bad buttons when no vote exists', () => {
    render(<VoteBar {...defaultProps} />);

    expect(screen.getByRole('button', { name: /tie/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /all bad/i })).toBeInTheDocument();
  });

  it('should show winner selected message when vote type is winner', () => {
    mocks.mockGetVote.mockReturnValue({ voteType: 'winner', winnerId: 'resp-1' });

    render(<VoteBar {...defaultProps} />);

    expect(screen.getByText('Winner selected')).toBeInTheDocument();
  });

  it('should show tie message when vote type is tie', () => {
    mocks.mockGetVote.mockReturnValue({ voteType: 'tie' });

    render(<VoteBar {...defaultProps} />);

    expect(screen.getByText("It's a tie")).toBeInTheDocument();
  });

  it('should show all bad message when vote type is all_bad', () => {
    mocks.mockGetVote.mockReturnValue({ voteType: 'all_bad' });

    render(<VoteBar {...defaultProps} />);

    expect(screen.getByText('All marked poor')).toBeInTheDocument();
  });

  it('should call submitVote with tie when tie button is clicked', async () => {
    render(<VoteBar {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: /tie/i }));

    await waitFor(() => {
      expect(mocks.mockSubmitVote).toHaveBeenCalledWith({
        messageId: 'msg-1',
        voteType: 'tie',
        winnerId: undefined,
        comparisonType: 'text',
        participantIds: ['resp-1', 'resp-2'],
      });
    });
  });

  it('should call submitVote with all_bad when all bad button is clicked', async () => {
    render(<VoteBar {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: /all bad/i }));

    await waitFor(() => {
      expect(mocks.mockSubmitVote).toHaveBeenCalledWith({
        messageId: 'msg-1',
        voteType: 'all_bad',
        winnerId: undefined,
        comparisonType: 'text',
        participantIds: ['resp-1', 'resp-2'],
      });
    });
  });

  it('should show success toast on successful vote', async () => {
    mocks.mockSubmitVote.mockResolvedValue(true);

    render(<VoteBar {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /tie/i }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Vote recorded');
    });
  });

  it('should show error toast on failed vote', async () => {
    mocks.mockSubmitVote.mockResolvedValue(false);

    render(<VoteBar {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /tie/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to record vote');
    });
  });

  it('should set hovered vote on mouse enter', () => {
    render(<VoteBar {...defaultProps} />);

    fireEvent.mouseEnter(screen.getByRole('button', { name: /tie/i }));

    expect(mocks.mockSetHoveredVote).toHaveBeenCalledWith({
      messageId: 'msg-1',
      voteType: 'tie',
    });
  });

  it('should clear hovered vote on mouse leave', () => {
    render(<VoteBar {...defaultProps} />);

    fireEvent.mouseLeave(screen.getByRole('button', { name: /tie/i }));

    expect(mocks.mockSetHoveredVote).toHaveBeenCalledWith(null);
  });

  it('should disable buttons when disabled prop is true', () => {
    render(<VoteBar {...defaultProps} disabled />);

    expect(screen.getByRole('button', { name: /tie/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /all bad/i })).toBeDisabled();
  });
});

describe('useCardVoting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockGetVote.mockReturnValue(null);
    mocks.mockSubmitVote.mockResolvedValue(true);
  });

  it('should return voting handlers', () => {
    const { result } = renderHook(() => useCardVoting('msg-1', 'text', ['resp-1', 'resp-2']));

    expect(result.current.handleCardClick).toBeDefined();
    expect(result.current.handleCardHover).toBeDefined();
    expect(result.current.handleCardHoverLeave).toBeDefined();
    expect(result.current.isVoted).toBe(false);
    expect(result.current.isSubmitting).toBe(false);
  });

  it('should submit winner vote on card click', async () => {
    const { result } = renderHook(() => useCardVoting('msg-1', 'text', ['resp-1', 'resp-2']));

    await act(async () => {
      await result.current.handleCardClick('resp-1');
    });

    expect(mocks.mockSubmitVote).toHaveBeenCalledWith({
      messageId: 'msg-1',
      voteType: 'winner',
      winnerId: 'resp-1',
      comparisonType: 'text',
      participantIds: ['resp-1', 'resp-2'],
    });
  });

  it('should not submit if already voted', async () => {
    mocks.mockGetVote.mockReturnValue({ voteType: 'winner' });

    const { result } = renderHook(() => useCardVoting('msg-1', 'text', ['resp-1', 'resp-2']));

    await act(async () => {
      await result.current.handleCardClick('resp-1');
    });

    expect(mocks.mockSubmitVote).not.toHaveBeenCalled();
  });

  it('should set hovered vote on card hover', () => {
    const { result } = renderHook(() => useCardVoting('msg-1', 'text', ['resp-1', 'resp-2']));

    act(() => {
      result.current.handleCardHover('resp-1');
    });

    expect(mocks.mockSetHoveredVote).toHaveBeenCalledWith({
      messageId: 'msg-1',
      voteType: 'winner',
      winnerId: 'resp-1',
    });
  });

  it('should clear hovered vote on hover leave', () => {
    const { result } = renderHook(() => useCardVoting('msg-1', 'text', ['resp-1', 'resp-2']));

    act(() => {
      result.current.handleCardHoverLeave();
    });

    expect(mocks.mockSetHoveredVote).toHaveBeenCalledWith(null);
  });
});
