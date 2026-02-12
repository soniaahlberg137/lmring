'use client';

import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  cn,
  Input,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@lmring/ui';
import { ChevronDownIcon } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

export interface WebPreviewContextValue {
  url: string;
  setUrl: (url: string) => void;
  consoleOpen: boolean;
  setConsoleOpen: (open: boolean) => void;
}

const WebPreviewContext = createContext<WebPreviewContextValue | null>(null);

const useWebPreview = () => {
  const context = useContext(WebPreviewContext);
  if (!context) {
    throw new Error('WebPreview components must be used within a WebPreview');
  }
  return context;
};

export type WebPreviewProps = ComponentProps<'div'> & {
  defaultUrl?: string;
  onUrlChange?: (url: string) => void;
};

export const WebPreview = ({
  className,
  children,
  defaultUrl = '',
  onUrlChange,
  ...props
}: WebPreviewProps) => {
  const [url, setUrl] = useState(defaultUrl);
  const [consoleOpen, setConsoleOpen] = useState(false);

  const handleUrlChange = useCallback(
    (newUrl: string) => {
      setUrl(newUrl);
      onUrlChange?.(newUrl);
    },
    [onUrlChange],
  );

  const contextValue = useMemo(
    () => ({
      consoleOpen,
      setConsoleOpen,
      setUrl: handleUrlChange,
      url,
    }),
    [consoleOpen, handleUrlChange, url],
  );

  return (
    <WebPreviewContext.Provider value={contextValue}>
      <div className={cn('flex flex-col overflow-hidden rounded-lg border', className)} {...props}>
        {children}
      </div>
    </WebPreviewContext.Provider>
  );
};

export type WebPreviewNavigationProps = ComponentProps<'div'>;

export const WebPreviewNavigation = ({
  className,
  children,
  ...props
}: WebPreviewNavigationProps) => (
  <div className={cn('flex items-center gap-2 border-b px-3 py-2', className)} {...props}>
    {children}
  </div>
);

export type WebPreviewNavigationButtonProps = ComponentProps<typeof Button> & {
  tooltip?: string;
};

export const WebPreviewNavigationButton = ({
  onClick,
  disabled,
  tooltip,
  children,
  ...props
}: WebPreviewNavigationButtonProps) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 shrink-0"
          onClick={onClick}
          disabled={disabled}
          {...props}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export type WebPreviewUrlProps = ComponentProps<typeof Input>;

export const WebPreviewUrl = ({ value, onChange, onKeyDown, ...props }: WebPreviewUrlProps) => {
  const { url, setUrl } = useWebPreview();
  const [prevUrl, setPrevUrl] = useState(url);
  const [inputValue, setInputValue] = useState(url);

  // Sync input value with context URL when it changes externally (derived state pattern)
  if (url !== prevUrl) {
    setPrevUrl(url);
    setInputValue(url);
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
    onChange?.(event);
  };

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        const target = event.target as HTMLInputElement;
        setUrl(target.value);
      }
      onKeyDown?.(event);
    },
    [setUrl, onKeyDown],
  );

  return (
    <Input
      className="h-7 flex-1 rounded-md border bg-muted/50 px-2 text-xs"
      value={inputValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      {...props}
    />
  );
};

export type WebPreviewBodyProps = ComponentProps<'iframe'> & {
  loading?: ReactNode;
};

export const WebPreviewBody = ({ className, loading, src, ...props }: WebPreviewBodyProps) => {
  const { url } = useWebPreview();

  return (
    <div className="relative flex-1">
      <iframe
        title="Web Preview"
        src={src ?? url}
        className={cn('h-full w-full border-0', className)}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        {...props}
      />
      {loading}
    </div>
  );
};

export type WebPreviewConsoleProps = ComponentProps<'div'> & {
  logs?: {
    level: 'log' | 'warn' | 'error';
    message: string;
    timestamp: Date;
  }[];
};

export const WebPreviewConsole = ({
  className,
  logs = [],
  children,
  ...props
}: WebPreviewConsoleProps) => {
  const { consoleOpen, setConsoleOpen } = useWebPreview();

  return (
    <Collapsible open={consoleOpen} onOpenChange={setConsoleOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between border-t px-4 py-2 text-xs text-muted-foreground hover:bg-muted/50">
        <span>Console</span>
        <ChevronDownIcon
          className={cn('size-3.5 transition-transform', consoleOpen && 'rotate-180')}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div
          className={cn(
            'max-h-40 overflow-auto border-t bg-zinc-950 p-3 font-mono text-xs text-zinc-100',
            className,
          )}
          {...props}
        >
          {logs.length === 0 ? (
            <span className="text-zinc-500">No console output</span>
          ) : (
            logs.map((log) => (
              <div
                key={`${log.timestamp.getTime()}-${log.message}`}
                className={cn(
                  'py-0.5',
                  log.level === 'error' && 'text-red-400',
                  log.level === 'warn' && 'text-yellow-400',
                )}
              >
                <span className="text-zinc-500">{log.timestamp.toLocaleTimeString()}</span>{' '}
                {log.message}
              </div>
            ))
          )}
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
