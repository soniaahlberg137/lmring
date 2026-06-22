import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SidebarServer } from '@/components/sidebar-server';
import { SidebarSkeleton } from '@/components/sidebar-skeleton';
import { PublicClientProviders } from '@/providers/public-client-providers';

export const metadata: Metadata = {
  title: 'Compare Agents — Tessera',
  description:
    'Compare AI agent benchmark scores side-by-side across GAIA, SWE-bench, tau-bench, and CORE-bench.',
  alternates: {
    canonical: '/compare',
  },
};

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return (
    <PublicClientProviders>
      <div className="fixed inset-0 flex bg-background">
        <Suspense fallback={<SidebarSkeleton />}>
          <SidebarServer />
        </Suspense>
        <div className="flex flex-col flex-1 overflow-hidden">
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </PublicClientProviders>
  );
}
