import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { Sidebar } from '@/components/sidebar';
import { auth } from '@/libs/Auth';
import { StoreProviders } from '@/providers/store-providers';

export const metadata: Metadata = {
  title: 'AI Model Leaderboard - Compare LLM Benchmarks',
  description:
    'Compare AI model performance with real-time benchmark rankings. View scores for GPQA, MMLU-Pro, LiveCodeBench, and community ELO ratings across top large language models.',
  alternates: {
    canonical: '/leaderboard',
  },
};

export default async function LeaderboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return children;
  }

  const user = session.user;
  const userData = {
    name: user.name || user.email,
    email: user.email,
    image: user.image || 'https://github.com/shadcn.png',
  };

  return (
    <StoreProviders>
      <div className="fixed inset-0 flex bg-background">
        <Sidebar user={userData} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </StoreProviders>
  );
}
