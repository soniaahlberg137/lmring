import { headers } from 'next/headers';

import { FrostedHeader } from '@/components/landing';
import { UserMenu } from '@/components/user-menu';
import { auth } from '@/libs/Auth';

export default async function PublicLayout(props: { children: React.ReactNode }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const userData = session?.user
    ? {
        name: session.user.name || undefined,
        email: session.user.email || undefined,
        image: session.user.image || 'https://github.com/shadcn.png',
      }
    : undefined;

  return (
    <div className="relative min-h-screen bg-slate-900">
      <FrostedHeader
        rightNav={
          session?.user ? (
            <li>
              <UserMenu user={userData} />
            </li>
          ) : null
        }
      />
      <main>{props.children}</main>
    </div>
  );
}
