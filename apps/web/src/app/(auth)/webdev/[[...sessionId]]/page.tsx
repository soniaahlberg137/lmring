import type { Metadata } from 'next';
import { WebDevStudio } from '@/components/webdev/webdev-studio';

export const metadata: Metadata = {
  title: 'WebDev Preview',
  description: 'AI-powered web development with live preview',
};

interface WebDevPageProps {
  params: Promise<{ sessionId?: string[] }>;
}

export default async function WebDevPage({ params }: WebDevPageProps) {
  const { sessionId: sessionIdSegments } = await params;
  const initialSessionId = sessionIdSegments?.[0];

  return <WebDevStudio initialSessionId={initialSessionId} />;
}
