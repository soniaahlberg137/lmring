'use client';

import { cn, Shimmer } from '@lmring/ui';
import { Loader2 } from 'lucide-react';
import type { VideoAttachment } from '@/types/workflow';
import { VideoPlayer } from '../video-player';

interface VideoAttachmentProps {
  data: VideoAttachment;
  className?: string;
}

export function VideoAttachmentDisplay({ data, className }: VideoAttachmentProps) {
  return (
    <div className={cn('w-[480px] rounded-lg border bg-muted', className)}>
      <VideoPlayer url={data.url} thumbnailUrl={data.thumbnailUrl} className="w-full" />
    </div>
  );
}

export function VideoGeneratingIndicator({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 p-4 rounded-lg border bg-muted/30 w-[350px]',
        className,
      )}
    >
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      <Shimmer duration={2.5} className="text-sm italic block leading-tight">
        Generating video...
      </Shimmer>
    </div>
  );
}
