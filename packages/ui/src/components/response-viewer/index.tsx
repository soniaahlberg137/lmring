import { StopCircle } from 'lucide-react';
import * as React from 'react';
import { harden } from 'rehype-harden';
import { Streamdown, defaultRehypePlugins } from 'streamdown';

import { cn } from '../../utils';
import { Shimmer } from '../shimmer';
import { StreamingCursor } from '../streaming-cursor';

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
        {content && (
          <div className={cn('text-sm', className)}>
            <Streamdown
              parseIncompleteMarkdown={true}
              isAnimating={false}
              controls={{ code: true }}
              rehypePlugins={permissiveRehypePlugins}
            >
              {content}
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

  if (!content && status === 'cancelled') {
    return (
      <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-500">
        <StopCircle className="h-4 w-4" />
        <span>Stopped by user</span>
      </div>
    );
  }

  if (!content) {
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
      >
        {content}
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
