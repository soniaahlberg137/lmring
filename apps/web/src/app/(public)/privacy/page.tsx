import type { Metadata } from 'next';
import Link from 'next/link';

import { getRequestLocale } from '@/libs/request-locale';
import { getServerTranslations } from '@/libs/server-translations';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const t = await getServerTranslations(locale);

  return {
    title: t('Privacy.meta_title'),
    description: t('Privacy.meta_description'),
  };
}

export default async function PrivacyPolicyPage() {
  const locale = await getRequestLocale();
  const t = await getServerTranslations(locale);

  return (
    <div className="flex min-h-screen flex-col">
      <section className="container mx-auto max-w-3xl px-4 pt-24 pb-16">
        <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-zinc-900 md:text-4xl">
          {t('Privacy.title')}
        </h1>
        <p className="mb-10 text-sm text-zinc-400">{t('Privacy.last_updated')}</p>

        <div className="space-y-8 text-base leading-relaxed text-zinc-600">
          <div>
            <h2 className="mb-3 text-xl font-bold text-zinc-900">
              {t('Privacy.section_intro_title')}
            </h2>
            <p>{t('Privacy.section_intro_body')}</p>
          </div>

          <div>
            <h2 className="mb-3 text-xl font-bold text-zinc-900">
              {t('Privacy.section_collect_title')}
            </h2>
            <p>{t('Privacy.section_collect_body')}</p>
          </div>

          <div>
            <h2 className="mb-3 text-xl font-bold text-zinc-900">
              {t('Privacy.section_use_title')}
            </h2>
            <p>{t('Privacy.section_use_body')}</p>
          </div>

          <div>
            <h2 className="mb-3 text-xl font-bold text-zinc-900">
              {t('Privacy.section_storage_title')}
            </h2>
            <p>{t('Privacy.section_storage_body')}</p>
          </div>

          <div>
            <h2 className="mb-3 text-xl font-bold text-zinc-900">
              {t('Privacy.section_third_party_title')}
            </h2>
            <p>{t('Privacy.section_third_party_body')}</p>
          </div>

          <div>
            <h2 className="mb-3 text-xl font-bold text-zinc-900">
              {t('Privacy.section_cookies_title')}
            </h2>
            <p>{t('Privacy.section_cookies_body')}</p>
          </div>

          <div>
            <h2 className="mb-3 text-xl font-bold text-zinc-900">
              {t('Privacy.section_rights_title')}
            </h2>
            <p>{t('Privacy.section_rights_body')}</p>
          </div>

          <div>
            <h2 className="mb-3 text-xl font-bold text-zinc-900">
              {t('Privacy.section_changes_title')}
            </h2>
            <p>{t('Privacy.section_changes_body')}</p>
          </div>

          <div>
            <h2 className="mb-3 text-xl font-bold text-zinc-900">
              {t('Privacy.section_contact_title')}
            </h2>
            <p>{t('Privacy.section_contact_body')}</p>
          </div>
        </div>

        <div className="mt-12 border-t border-zinc-200 pt-6 text-sm text-zinc-400">
          <Link href="/terms" className="text-blue-600 hover:underline">
            {t('Privacy.view_terms')}
          </Link>
        </div>
      </section>
    </div>
  );
}
