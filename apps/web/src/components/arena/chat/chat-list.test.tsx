import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./message', () => ({
  Message: ({
    message,
    isStreaming,
    status,
    error,
  }: {
    message: { id: string; role: string; content: string };
    isStreaming?: boolean;
    status?: string;
    error?: string;
  }) => (
    <div
      data-testid={`message-${message.id}`}
      data-role={message.role}
      data-streaming={isStreaming}
    >
      {message.content}
      {status && <span data-testid="status">{status}</span>}
      {error && <span data-testid="error">{error}</span>}
    </div>
  ),
}));

import type { WorkflowMessage } from '@/types/workflow';
import { ChatList } from './chat-list';

const mockMessages: WorkflowMessage[] = [
  {
    id: 'msg-1',
    role: 'user',
    content: 'Hello',
    timestamp: new Date('2024-01-01T10:00:00'),
  },
  {
    id: 'msg-2',
    role: 'assistant',
    content: 'Hi there!',
    timestamp: new Date('2024-01-01T10:00:01'),
  },
];

describe('ChatList', () => {
  beforeEach(() => {
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: vi.fn(),
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('should render messages', () => {
    render(<ChatList messages={mockMessages} />);

    expect(screen.getByTestId('message-msg-1')).toBeInTheDocument();
    expect(screen.getByTestId('message-msg-2')).toBeInTheDocument();
  });

  it('should render user message content', () => {
    render(<ChatList messages={mockMessages} />);

    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('should render assistant message content', () => {
    render(<ChatList messages={mockMessages} />);

    expect(screen.getByText('Hi there!')).toBeInTheDocument();
  });

  it('should render pending response when provided', () => {
    const pendingResponse = {
      content: 'Thinking...',
      startTime: Date.now(),
    };

    render(<ChatList messages={mockMessages} pendingResponse={pendingResponse} status="running" />);

    expect(screen.getByTestId('message-pending')).toBeInTheDocument();
    expect(screen.getByText('Thinking...')).toBeInTheDocument();
  });

  it('should show streaming status for pending response', () => {
    const pendingResponse = {
      content: 'Streaming...',
      startTime: Date.now(),
    };

    render(<ChatList messages={mockMessages} pendingResponse={pendingResponse} status="running" />);

    const pendingMessage = screen.getByTestId('message-pending');
    expect(pendingMessage).toHaveAttribute('data-streaming', 'true');
  });

  it('should filter empty assistant messages when pendingResponse exists', () => {
    const messagesWithEmpty: WorkflowMessage[] = [
      ...mockMessages,
      {
        id: 'msg-3',
        role: 'assistant',
        content: '',
        timestamp: new Date('2024-01-01T10:00:02'),
      },
    ];

    const pendingResponse = {
      content: 'Processing...',
      startTime: Date.now(),
    };

    render(<ChatList messages={messagesWithEmpty} pendingResponse={pendingResponse} />);

    expect(screen.queryByTestId('message-msg-3')).not.toBeInTheDocument();
  });

  it('should render messages without pending response', () => {
    const messagesWithEmpty: WorkflowMessage[] = [
      ...mockMessages,
      {
        id: 'msg-3',
        role: 'assistant',
        content: '',
        timestamp: new Date('2024-01-01T10:00:02'),
      },
    ];

    render(<ChatList messages={messagesWithEmpty} />);

    expect(screen.getByTestId('message-msg-3')).toBeInTheDocument();
  });

  it('should pass providerId to messages', () => {
    render(<ChatList messages={mockMessages} providerId="openai" />);

    expect(screen.getByTestId('message-msg-1')).toBeInTheDocument();
  });

  it('should render with error state', () => {
    const pendingResponse = {
      content: 'Error occurred',
      startTime: Date.now(),
    };

    render(
      <ChatList
        messages={mockMessages}
        pendingResponse={pendingResponse}
        status="failed"
        error="Connection failed"
      />,
    );

    expect(screen.getByTestId('error')).toHaveTextContent('Connection failed');
  });

  it('should handle empty messages array', () => {
    render(<ChatList messages={[]} />);

    expect(screen.getByTestId('scroll-area')).toBeInTheDocument();
  });

  it('should render reasoning in pending response', () => {
    const pendingResponse = {
      content: 'Response',
      reasoning: 'Let me think...',
      startTime: Date.now(),
    };

    render(<ChatList messages={mockMessages} pendingResponse={pendingResponse} />);

    expect(screen.getByTestId('message-pending')).toBeInTheDocument();
  });
});
