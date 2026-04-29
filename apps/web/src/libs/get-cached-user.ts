import { headers } from 'next/headers';
import { cache } from 'react';
import { auth } from '@/libs/Auth';

export type CachedUser = {
  name: string;
  email: string;
  image: string;
};

export const getCachedUser = cache(async (): Promise<CachedUser | null> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const { user } = session;
  return {
    name: user.name || user.email,
    email: user.email,
    image: user.image || 'https://github.com/shadcn.png',
  };
});
