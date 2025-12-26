import type { Locale } from '@lmring/i18n';
import { headers } from 'next/headers';
import { setRequestLocale } from 'next-intl/server';

import { FrostedHeader } from '@/components/landing';
import { UserMenu } from '@/components/user-menu';
import { auth } from '@/libs/Auth';

export default async function PublicLayout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  setRequestLocale(locale as Locale);

  // Check if user is logged in
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Prepare user data if logged in
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
