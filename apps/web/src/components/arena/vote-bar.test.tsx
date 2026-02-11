import { cleanup, render, screen } from '@testing-library/react';
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

import { VoteBar } from './vote-bar';

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

  it('should render tie and all bad buttons when not disabled', () => {
    const { container } = render(<VoteBar {...defaultProps} />);
    expect(container.firstChild).not.toBeNull();
    expect(screen.getByText('Tie')).toBeInTheDocument();
    expect(screen.getByText('All Bad')).toBeInTheDocument();
  });

  it('should hide buttons when disabled', () => {
    const { container } = render(<VoteBar {...defaultProps} disabled />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('opacity-0');
    expect(wrapper).toHaveClass('pointer-events-none');
  });

  it('should return null when vote exists', () => {
    mocks.mockGetVote.mockReturnValue({ voteType: 'tie' });
    const { container } = render(<VoteBar {...defaultProps} />);
    expect(container.firstChild).toBeNull();
  });
});
