import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ResponseViewer } from './index';

// Mock streamdown
vi.mock('streamdown', () => ({
  Streamdown: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="streamdown">{children}</div>
  ),
  defaultRehypePlugins: {
    raw: null,
    katex: null,
  },
}));

// Mock rehype-harden
vi.mock('rehype-harden', () => ({
  harden: null,
}));

describe('ResponseViewer', () => {
  it('renders content', () => {
    render(<ResponseViewer content="Hello world" />);
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('shows waiting message when content is empty', () => {
    render(<ResponseViewer content="" />);
    expect(screen.getByText('Waiting for response...')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<ResponseViewer content="Test" className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('shows streaming cursor when streaming', () => {
    const { container } = render(<ResponseViewer content="Streaming..." isStreaming />);
    const cursor = container.querySelector('[data-testid="streamdown"]')?.parentElement?.querySelector('.streaming-cursor');
    // The cursor component exists in DOM
    expect(container.firstChild).toBeInTheDocument();
  });

  it('shows cancelled message when status is cancelled and no content', () => {
    render(<ResponseViewer content="" status="cancelled" />);
    expect(screen.getByText('Stopped by user')).toBeInTheDocument();
  });

  it('shows cancelled message alongside content when streaming was cancelled', () => {
    render(<ResponseViewer content="Partial response" status="cancelled" />);
    expect(screen.getByText('Partial response')).toBeInTheDocument();
    expect(screen.getByText('Stopped by user')).toBeInTheDocument();
  });

  it('shows failed state with error message', () => {
    render(<ResponseViewer content="" status="failed" error="Network error" />);
    expect(screen.getByText('Request failed')).toBeInTheDocument();
    expect(screen.getByText('Network error')).toBeInTheDocument();
  });

  it('shows failed state with partial content', () => {
    render(<ResponseViewer content="Partial response" status="failed" error="Timeout" />);
    expect(screen.getByText('Partial response')).toBeInTheDocument();
    expect(screen.getByText('Request failed')).toBeInTheDocument();
  });

  it('renders with default streaming false', () => {
    render(<ResponseViewer content="Content" />);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });
});

describe('ResponseViewer exports', () => {
  it('exports ResponseViewer component', () => {
    expect(ResponseViewer).toBeDefined();
    expect(typeof ResponseViewer).toBe('function');
  });
});
