import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthFormWrapper } from '@/components/auth';
import { getRequestLocale } from '@/libs/request-locale';
import { getServerTranslations } from '@/libs/server-translations';

type ISignInPageProps = {
  searchParams: Promise<{ callbackUrl?: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const t = await getServerTranslations(locale);

  return {
    title: t('SignIn.meta_title'),
    description: t('SignIn.meta_description'),
  };
}

export default async function SignInPage(props: ISignInPageProps) {
  const { callbackUrl } = await props.searchParams;
  const locale = await getRequestLocale();
  const t = await getServerTranslations(locale);

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">{t('SignIn.meta_title')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t('SignIn.meta_description')}</p>
      </div>

      <AuthFormWrapper type="signin" callbackUrl={callbackUrl || '/arena'} />

      <div className="text-center text-sm">
        <span className="text-muted-foreground">Don't have an account? </span>
        <Link href="/sign-up" className="font-medium text-primary hover:underline">
          Sign up
        </Link>
      </div>
    </div>
  );
}
