'use client';

import { Avatar, AvatarFallback, AvatarImage, cn, ResponseViewer } from '@lmring/ui';
import { UserIcon } from 'lucide-react';
import { useSession } from '@/libs/AuthClient';
import { formatErrorForDisplay } from '@/libs/format-api-error';
import type { WorkflowMessage, WorkflowStatus } from '@/types/workflow';
import { ProviderIcon } from '../provider-icon';
import { MessageActions } from './message-actions';
import { MessageAttachments } from './message-attachment';
import { Reasoning, ReasoningContent, ReasoningTrigger } from './reasoning';
import { VideoAttachmentDisplay, VideoGeneratingIndicator } from './video-attachment';

interface MessageProps {
  message: WorkflowMessage;
  isStreaming?: boolean;
  isVideoGenerating?: boolean;
  status?: WorkflowStatus;
  error?: string;
  providerId?: string;
  onRetry?: () => void;
  onMaximize?: (content: string) => void;
}

export function Message({
  message,
  isStreaming = false,
  isVideoGenerating = false,
  status,
  error,
  providerId,
  onRetry,
  onMaximize,
}: MessageProps) {
  const { data: session } = useSession();
  const user = session?.user;
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  return (
    <div className={cn('flex w-full gap-4 p-4', isUser ? 'flex-row-reverse' : 'flex-row')}>
      {isUser ? (
        <Avatar className="size-8 border shadow-sm flex-shrink-0">
          <AvatarImage src={user?.image || undefined} alt={user?.name || 'User'} />
          <AvatarFallback className="bg-muted">
            <UserIcon className="size-4 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
      ) : (
        <div
          className={cn(
            'flex size-8 shrink-0 select-none items-center justify-center rounded-full border shadow-sm bg-background',
          )}
        >
          {providerId && <ProviderIcon providerId={providerId} size={16} />}
        </div>
      )}

      <div className={cn('flex max-w-[90%] flex-col gap-2', isUser ? 'items-end' : 'items-start')}>
        {isUser && message.attachments && message.attachments.length > 0 && (
          <MessageAttachments attachments={message.attachments} className="mb-1" />
        )}

        {isUser ? (
          <div className="group relative rounded-2xl bg-primary px-4 py-2 text-primary-foreground">
            <p className="whitespace-pre-wrap text-sm">{message.content}</p>
            <MessageActions
              content={message.content}
              showRetry={false}
              className="absolute top-1/2 -left-10 -translate-y-1/2 text-muted-foreground"
            />
          </div>
        ) : (
          <div className="w-full space-y-2">
            {message.reasoning && (
              <Reasoning isStreaming={isStreaming}>
                <ReasoningTrigger />
                <ReasoningContent>
                  <ResponseViewer
                    content={message.reasoning}
                    isStreaming={isStreaming}
                    className="text-muted-foreground"
                  />
                </ReasoningContent>
              </Reasoning>
            )}
            {/* Hide text content when video attachment exists (content is just "[video](url)") */}
            {!isVideoGenerating &&
              !(
                message.videoAttachment &&
                (!message.content.trim() || /^\[video\]\(.*\)$/.test(message.content.trim()))
              ) && (
                <div className="group relative w-fit max-w-full rounded-2xl border bg-muted/30 p-3 text-foreground backdrop-blur-sm">
                  <ResponseViewer
                    content={message.content}
                    isStreaming={isStreaming}
                    status={status}
                    error={error}
                    formatError={formatErrorForDisplay}
                    className="overflow-x-auto custom-scrollbar"
                  />
                  {isAssistant && !isStreaming && (
                    <MessageActions
                      content={message.content}
                      onRetry={onRetry}
                      onMaximize={onMaximize ? () => onMaximize(message.content) : undefined}
                      showRetry={!!onRetry}
                      className="absolute -top-7 right-0 text-muted-foreground"
                    />
                  )}
                </div>
              )}
            {message.attachments && message.attachments.length > 0 && (
              <MessageAttachments attachments={message.attachments} className="mt-2" />
            )}
            {message.videoAttachment && (
              <VideoAttachmentDisplay data={message.videoAttachment} className="mt-2" />
            )}
            {isVideoGenerating && !message.videoAttachment && (
              <VideoGeneratingIndicator className="mt-2" />
            )}
            {!isStreaming && message.metrics && (
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                {message.metrics.responseTime && <span>{message.metrics.responseTime}ms</span>}
                {message.metrics.tokenCount && <span>{message.metrics.tokenCount} tokens</span>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
