import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SidebarServer } from '@/components/sidebar-server';
import { SidebarSkeleton } from '@/components/sidebar-skeleton';
import { PublicClientProviders } from '@/providers/public-client-providers';

export const metadata: Metadata = {
  title: 'AI Model Leaderboard - Compare LLM Benchmarks',
  description:
    'Compare AI model performance with real-time benchmark rankings. View scores for GPQA, MMLU-Pro, LiveCodeBench, and community ELO ratings across top large language models.',
  alternates: {
    canonical: '/leaderboard',
  },
};

export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
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
