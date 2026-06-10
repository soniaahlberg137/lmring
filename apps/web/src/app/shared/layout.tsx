import type { Metadata } from 'next';
import { QueryProvider } from '@/providers/query-provider';

export const metadata: Metadata = {
  title: 'Shared Conversation - LMRing',
  description: 'View a shared conversation from LMRing Arena',
};

export default function SharedLayout({ children }: { children: React.ReactNode }) {
  return <QueryProvider>{children}</QueryProvider>;
}
