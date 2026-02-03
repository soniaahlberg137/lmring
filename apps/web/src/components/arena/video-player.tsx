'use client';

import dynamic from 'next/dynamic';
import type { PlyrOptions } from 'plyr-react';
import 'plyr-react/plyr.css';

const Plyr = dynamic(() => import('plyr-react').then((mod) => ({ default: mod.Plyr })), {
  ssr: false,
});

interface VideoPlayerProps {
  url: string;
  thumbnailUrl?: string;
  className?: string;
}

export function VideoPlayer({ url, thumbnailUrl, className }: VideoPlayerProps) {
  return (
    <div className={className}>
      <Plyr
        source={{
          type: 'video',
          sources: [{ src: url, type: 'video/mp4' }],
          poster: thumbnailUrl,
        }}
        options={
          {
            controls: [
              'play-large',
              'play',
              'progress',
              'current-time',
              'mute',
              'volume',
              'download',
              'fullscreen',
            ],
            ratio: '16:9',
            urls: {
              download: url,
            },
            listeners: {
              download: (event: Event) => {
                event.preventDefault();
                fetch(url)
                  .then((response) => response.blob())
                  .then((blob) => {
                    const blobUrl = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = blobUrl;
                    a.download = 'video.mp4';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(blobUrl);
                  });
              },
            },
          } as PlyrOptions & {
            urls: { download: string };
            listeners: { download: (event: Event) => void };
          }
        }
      />
    </div>
  );
}
