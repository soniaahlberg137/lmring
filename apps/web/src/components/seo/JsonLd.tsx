import { getBaseUrl } from '@/utils/BaseUrl';

export function JsonLd() {
  const baseUrl = getBaseUrl();

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'LMRing',
    url: baseUrl,
    logo: `${baseUrl}/athena-black.svg`,
    description:
      'LMRing is an open-source AI model comparison platform that helps users evaluate and compare large language models through side-by-side testing, benchmarks, and community-driven rankings.',
    sameAs: ['https://github.com/llm-ring/lmring'],
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'LMRing',
    url: baseUrl,
    description:
      'Compare and evaluate AI models side-by-side. Find the best large language model for your use case with real benchmarks, community rankings, and comprehensive analysis.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/leaderboard?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  const softwareAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'LMRing',
    url: baseUrl,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    description:
      'Open-source platform for comparing AI models side-by-side with real-time evaluation, benchmark leaderboards, and data-driven insights.',
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppSchema) }}
      />
    </>
  );
}
