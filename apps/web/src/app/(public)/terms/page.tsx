import type { Metadata } from 'next';
import Link from 'next/link';

import { getRequestLocale } from '@/libs/request-locale';
import { getServerTranslations } from '@/libs/server-translations';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const t = await getServerTranslations(locale);

  return {
    title: t('Terms.meta_title'),
    description: t('Terms.meta_description'),
  };
}

export default async function TermsOfServicePage() {
  const locale = await getRequestLocale();
  const t = await getServerTranslations(locale);

  return (
    <div className="flex min-h-screen flex-col">
      <section className="container mx-auto max-w-3xl px-4 pt-24 pb-16">
        <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-zinc-900 md:text-4xl">
          {t('Terms.title')}
        </h1>
        <p className="mb-10 text-sm text-zinc-400">{t('Terms.last_updated')}</p>

        <div className="space-y-8 text-base leading-relaxed text-zinc-600">
          <div>
            <h2 className="mb-3 text-xl font-bold text-zinc-900">
              {t('Terms.section_acceptance_title')}
            </h2>
            <p>{t('Terms.section_acceptance_body')}</p>
          </div>

          <div>
            <h2 className="mb-3 text-xl font-bold text-zinc-900">
              {t('Terms.section_description_title')}
            </h2>
            <p>{t('Terms.section_description_body')}</p>
          </div>

          <div>
            <h2 className="mb-3 text-xl font-bold text-zinc-900">
              {t('Terms.section_accounts_title')}
            </h2>
            <p>{t('Terms.section_accounts_body')}</p>
          </div>

          <div>
            <h2 className="mb-3 text-xl font-bold text-zinc-900">
              {t('Terms.section_api_keys_title')}
            </h2>
            <p>{t('Terms.section_api_keys_body')}</p>
          </div>

          <div>
            <h2 className="mb-3 text-xl font-bold text-zinc-900">
              {t('Terms.section_acceptable_use_title')}
            </h2>
            <p>{t('Terms.section_acceptable_use_body')}</p>
          </div>

          <div>
            <h2 className="mb-3 text-xl font-bold text-zinc-900">{t('Terms.section_ip_title')}</h2>
            <p>{t('Terms.section_ip_body')}</p>
          </div>

          <div>
            <h2 className="mb-3 text-xl font-bold text-zinc-900">
              {t('Terms.section_disclaimer_title')}
            </h2>
            <p>{t('Terms.section_disclaimer_body')}</p>
          </div>

          <div>
            <h2 className="mb-3 text-xl font-bold text-zinc-900">
              {t('Terms.section_limitation_title')}
            </h2>
            <p>{t('Terms.section_limitation_body')}</p>
          </div>

          <div>
            <h2 className="mb-3 text-xl font-bold text-zinc-900">
              {t('Terms.section_termination_title')}
            </h2>
            <p>{t('Terms.section_termination_body')}</p>
          </div>

          <div>
            <h2 className="mb-3 text-xl font-bold text-zinc-900">
              {t('Terms.section_changes_title')}
            </h2>
            <p>{t('Terms.section_changes_body')}</p>
          </div>

          <div>
            <h2 className="mb-3 text-xl font-bold text-zinc-900">
              {t('Terms.section_contact_title')}
            </h2>
            <p>{t('Terms.section_contact_body')}</p>
          </div>
        </div>

        <div className="mt-12 border-t border-zinc-200 pt-6 text-sm text-zinc-400">
          <Link href="/privacy" className="text-blue-600 hover:underline">
            {t('Terms.view_privacy')}
          </Link>
        </div>
      </section>
    </div>
  );
}
