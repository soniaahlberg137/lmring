'use client';

import { env } from '@lmring/env';
import { lazy, Suspense, useEffect, useState } from 'react';

// posthog-js (~60KB gzipped) is non-critical analytics: defer it until after
// hydration so it never competes with the initial bundle or hydration work.
const PostHogAnalytics = lazy(() =>
  import('./PostHogAnalytics').then((mod) => ({ default: mod.PostHogAnalytics })),
);

export const PostHogProvider = (props: { children: React.ReactNode }) => {
  const [analyticsReady, setAnalyticsReady] = useState(false);

  useEffect(() => {
    if (env.NEXT_PUBLIC_POSTHOG_KEY) {
      setAnalyticsReady(true);
    }
  }, []);

  // children always render at the same tree position so toggling analytics
  // on never remounts the app subtree
  return (
    <>
      {props.children}
      {analyticsReady && (
        <Suspense fallback={null}>
          <PostHogAnalytics />
        </Suspense>
      )}
    </>
  );
};
