import { setRequestLocale } from 'next-intl/server';
import { getRequestLocale } from '@/libs/request-locale';

export default async function AuthPagesLayout(props: { children: React.ReactNode }) {
  const locale = await getRequestLocale();
  setRequestLocale(locale);

  return <div className="flex min-h-screen items-center justify-center">{props.children}</div>;
}
