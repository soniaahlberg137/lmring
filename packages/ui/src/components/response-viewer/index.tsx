import { StopCircle } from 'lucide-react';
import * as React from 'react';
import { harden } from 'rehype-harden';
import { defaultRehypePlugins, Streamdown } from 'streamdown';

import { cn } from '../../utils';
import { Shimmer } from '../shimmer';
import { StreamingCursor } from '../streaming-cursor';

const BLOCK_ELEMENTS = ['div', 'figure', 'table', 'ul', 'ol', 'blockquote', 'pre', 'hr', 'section', 'article'];

function hasBlockElement(children: React.ReactNode): boolean {
  return React.Children.toArray(children).some((child) => {
    if (!React.isValidElement(child)) return false;
    const type = child.type;
    if (typeof type === 'string') {
      return BLOCK_ELEMENTS.includes(type);
    }
    // Custom React components (like Streamdown's image renderer) may render
    // block-level elements. Treat them as block to avoid invalid nesting.
    return typeof type === 'function' || typeof type === 'object';
  });
}

function MarkdownParagraph(props: React.ComponentProps<'p'>) {
  if (hasBlockElement(props.children)) {
    return <div className="mb-4 last:mb-0" {...props} />;
  }
  return <p {...props} />;
}

const markdownComponents = {
  p: MarkdownParagraph,
};

const permissiveRehypePlugins = [
  defaultRehypePlugins.raw,
  defaultRehypePlugins.katex,
  [
    harden,
    {
      allowedImagePrefixes: ['*'],
      allowedLinkPrefixes: ['*'],
      allowedProtocols: ['http', 'https', 'mailto'],
      allowDataImages: true,
    },
  ],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
].filter(Boolean) as any[];

/**
 * Strips AI reasoning blocks (<think>...</think>) from content.
 * Some AI providers return raw reasoning with these XML-style tags,
 * which are not valid HTML and cause React errors when rendered.
 * Removes both the tags and the content between them.
 */
function stripThinkTags(content: string): string {
  // Strip complete <think>...</think> and <thinking>...</thinking> blocks
  let result = content.replace(/<think(?:ing)?\b[^>]*>[\s\S]*?<\/think(?:ing)?>/gi, '');
  // Strip unclosed <think>/<thinking> tag and everything after it (streaming)
  result = result.replace(/<think(?:ing)?\b[^>]*>[\s\S]*/gi, '');
  return result;
}

export type ResponseViewerStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface FormattedErrorInfo {
  title: string;
  detail: string;
  isRetryable: boolean;
}

interface ResponseViewerProps {
  content: string;
  isStreaming?: boolean;
  status?: ResponseViewerStatus;
  error?: string;
  formatError?: (error: string) => FormattedErrorInfo;
  className?: string;
}

function ResponseViewer({
  content,
  isStreaming = false,
  status,
  error,
  formatError,
  className,
}: ResponseViewerProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const strippedContent = stripThinkTags(content);

  // biome-ignore lint/correctness/useExhaustiveDependencies: content triggers scroll
  React.useEffect(() => {
    if (isStreaming && containerRef.current) {
      const container = containerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  }, [isStreaming, content]);

  if (status === 'failed') {
    const errorInfo = formatError && error ? formatError(error) : null;

    return (
      <div className="space-y-2">
        {strippedContent && (
          <div className={cn('text-sm', className)}>
            <Streamdown
              parseIncompleteMarkdown={true}
              isAnimating={false}
              controls={{ code: true }}
              rehypePlugins={permissiveRehypePlugins}
              components={markdownComponents}
            >
              {strippedContent}
            </Streamdown>
          </div>
        )}
        <div className="flex items-start gap-2 text-sm text-destructive">
          <StopCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <div className="font-medium">{errorInfo?.title ?? 'Request failed'}</div>
            {errorInfo ? (
              <>
                {errorInfo.detail && (
                  <div className="text-xs mt-1 opacity-90">{errorInfo.detail}</div>
                )}
                {errorInfo.isRetryable && (
                  <div className="text-xs mt-1 opacity-70 italic">
                    This error may be temporary. Try again.
                  </div>
                )}
              </>
            ) : (
              error && <div className="text-xs mt-1 opacity-90">{error}</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!strippedContent && status === 'cancelled') {
    return (
      <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-500">
        <StopCircle className="h-4 w-4" />
        <span>Stopped by user</span>
      </div>
    );
  }

  if (!strippedContent) {
    return (
      <Shimmer duration={2.5} className="text-sm italic block leading-tight">
        Waiting for response...
      </Shimmer>
    );
  }

  return (
    <div ref={containerRef} className={cn('text-sm', className)}>
      <Streamdown
        parseIncompleteMarkdown={true}
        isAnimating={isStreaming}
        controls={{ code: true }}
        rehypePlugins={permissiveRehypePlugins}
        components={markdownComponents}
      >
        {strippedContent}
      </Streamdown>
      {isStreaming && <StreamingCursor />}
      {status === 'cancelled' && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-500">
          <StopCircle className="h-3 w-3" />
          <span>Stopped by user</span>
        </div>
      )}
    </div>
  );
}

export { ResponseViewer };
export type { ResponseViewerProps };
