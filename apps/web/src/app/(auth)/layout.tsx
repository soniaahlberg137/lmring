import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';
import { auth } from '@/libs/Auth';
import { StoreProviders } from '@/providers/store-providers';

export default async function AuthLayout(props: { children: React.ReactNode }) {
  // Get session from server-side auth
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Redirect to sign-in if no session
  if (!session) {
    redirect('/sign-in');
  }

  const user = session.user;

  // Map Better-Auth fields to expected UI fields
  const userData = {
    name: user.name || user.email,
    email: user.email,
    image: user.image || 'https://github.com/shadcn.png',
  };

  return (
    <StoreProviders>
      <div className="flex h-screen bg-background">
        {/* Left Sidebar - Full Height */}
        <Sidebar user={userData} />

        {/* Right Content Area */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Main Content */}
          <main className="flex-1 overflow-auto">{props.children}</main>
        </div>
      </div>
    </StoreProviders>
  );
}
