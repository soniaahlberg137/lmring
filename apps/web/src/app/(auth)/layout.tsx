import { Suspense } from 'react';
import { SidebarServer } from '@/components/sidebar-server';
import { SidebarSkeleton } from '@/components/sidebar-skeleton';
import { AuthedClientProviders } from '@/providers/authed-client-providers';

export default function AuthLayout(props: { children: React.ReactNode }) {
  return (
    <AuthedClientProviders>
      <div className="flex h-screen bg-background">
        <Suspense fallback={<SidebarSkeleton />}>
          <SidebarServer />
        </Suspense>
        <div className="flex flex-col flex-1 overflow-hidden">
          <main className="flex-1 overflow-auto">{props.children}</main>
        </div>
      </div>
    </AuthedClientProviders>
  );
}
