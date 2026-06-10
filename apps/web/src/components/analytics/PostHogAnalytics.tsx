'use client';

import { env } from '@lmring/env';
import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { useEffect } from 'react';
import { SuspendedPostHogPageView } from './PostHogPageView';

// Mounted lazily (after hydration) by PostHogProvider. The posthog context only
// needs to reach the pageview tracker — no app component consumes usePostHog.
export const PostHogAnalytics = () => {
  useEffect(() => {
    if (env.NEXT_PUBLIC_POSTHOG_KEY) {
      posthog.init(env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host: env.NEXT_PUBLIC_POSTHOG_HOST,
        capture_pageview: false, // Disable automatic pageview capture, as we capture manually
        capture_pageleave: true, // Enable pageleave capture
      });
    }
  }, []);

  return (
    <PHProvider client={posthog}>
      <SuspendedPostHogPageView />
    </PHProvider>
  );
};
