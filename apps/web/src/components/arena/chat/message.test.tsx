import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { WorkflowMessage } from '@/types/workflow';
import { Message } from './message';

const { useSessionMock } = vi.hoisted(() => ({
  useSessionMock: vi.fn(),
}));
vi.mock('@/libs/AuthClient', () => ({
  useSession: () => useSessionMock(),
}));

vi.mock('../provider-icon', () => ({
  ProviderIcon: ({ providerId }: { providerId: string }) => (
    <span data-testid="provider-icon">{providerId}</span>
  ),
}));

vi.mock('./message-actions', () => ({
  MessageActions: ({ content }: { content: string }) => (
    <div data-testid="message-actions">{content}</div>
  ),
}));

vi.mock('./message-attachment', () => ({
  MessageAttachments: ({ attachments }: { attachments: unknown[] }) => (
    <div data-testid="message-attachments">{attachments.length}</div>
  ),
}));

vi.mock('./reasoning', () => ({
  Reasoning: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="reasoning">{children}</div>
  ),
  ReasoningTrigger: () => <button type="button">Reasoning</button>,
  ReasoningContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('Message', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSessionMock.mockReturnValue({ data: { user: { name: 'User', image: null } } });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders user message with reverse layout and attachments', () => {
    const message: WorkflowMessage = {
      id: 'm1',
      role: 'user',
      content: 'Hello',
      timestamp: new Date(),
      attachments: [{ type: 'file', url: 'https://x', filename: 'x.png', mediaType: 'image/png' }],
    };

    const { container } = render(<Message message={message} />);

    expect(screen.getByText('Hello', { selector: 'p' })).toBeInTheDocument();
    expect(screen.getByTestId('message-attachments')).toHaveTextContent('1');
    expect(container.querySelector('.flex-row-reverse')).toBeInTheDocument();
  });

  it('renders assistant message with provider icon, reasoning, and metrics', () => {
    const message: WorkflowMessage = {
      id: 'm2',
      role: 'assistant',
      content: 'Hi',
      reasoning: 'Thinking...',
      timestamp: new Date(),
      metrics: { responseTime: 123, tokenCount: 45 },
      attachments: [
        { type: 'file', url: 'https://x', filename: 'x.pdf', mediaType: 'application/pdf' },
      ],
    };

    render(<Message message={message} providerId="openai" isStreaming={false} />);

    expect(screen.getByTestId('provider-icon')).toHaveTextContent('openai');
    const viewers = screen.getAllByTestId('response-viewer');
    expect(viewers.find((el) => el.textContent === 'Hi')).toBeInTheDocument();
    expect(screen.getByTestId('reasoning')).toHaveTextContent('Thinking...');
    expect(screen.getByText('123ms')).toBeInTheDocument();
    expect(screen.getByText('45 tokens')).toBeInTheDocument();
    expect(screen.getByTestId('message-attachments')).toHaveTextContent('1');
  });
});
