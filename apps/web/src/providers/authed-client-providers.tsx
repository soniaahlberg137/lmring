'use client';

import type { ReactNode } from 'react';
import { PostHogProvider } from '@/components/analytics/PostHogProvider';
import { QueryProvider } from '@/providers/query-provider';
import { StoreProviders } from '@/providers/store-providers';

export function AuthedClientProviders({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <PostHogProvider>
        <StoreProviders>{children}</StoreProviders>
      </PostHogProvider>
    </QueryProvider>
  );
}
