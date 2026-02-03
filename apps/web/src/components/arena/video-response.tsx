import { AlertCircle, Loader2 } from 'lucide-react';
import { VideoPlayer } from './video-player';

interface VideoResponseProps {
  url?: string;
  thumbnailUrl?: string;
  isLoading?: boolean;
  error?: string;
}

export function VideoResponse({ url, thumbnailUrl, isLoading, error }: VideoResponseProps) {
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 p-6 text-destructive">
        <AlertCircle className="h-8 w-8" />
        <p className="text-sm text-center">{error}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Generating video...</p>
      </div>
    );
  }

  if (!url) return null;

  return (
    <div className="w-full flex items-center justify-center p-4">
      <VideoPlayer url={url} thumbnailUrl={thumbnailUrl} className="rounded-lg w-full max-w-2xl" />
    </div>
  );
}
