'use client';

import dynamic from 'next/dynamic';
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
        options={{
          controls: ['play', 'progress', 'current-time', 'mute', 'volume', 'fullscreen'],
        }}
      />
    </div>
  );
}
