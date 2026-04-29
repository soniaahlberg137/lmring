import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { SidebarServer } from '@/components/sidebar-server';
import { SidebarSkeleton } from '@/components/sidebar-skeleton';
import { getCachedUser } from '@/libs/get-cached-user';
import { AuthedClientProviders } from '@/providers/authed-client-providers';

export default async function AuthLayout(props: { children: React.ReactNode }) {
  const user = await getCachedUser();
  if (!user) {
    redirect('/sign-in');
  }

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
