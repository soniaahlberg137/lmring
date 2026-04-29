'use client';

import type { ReactNode } from 'react';
import { QueryProvider } from '@/providers/query-provider';
import { StoreProviders } from '@/providers/store-providers';

export function PublicClientProviders({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <StoreProviders>{children}</StoreProviders>
    </QueryProvider>
  );
}
