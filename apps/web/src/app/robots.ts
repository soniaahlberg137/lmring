import type { MetadataRoute } from 'next';
import { getBaseUrl } from '@/utils/BaseUrl';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/arena/', '/settings/', '/account/', '/api/'],
      },
      { userAgent: 'GPTBot', allow: '/' },
      { userAgent: 'Google-Extended', allow: '/' },
      { userAgent: 'ClaudeBot', allow: '/' },
      { userAgent: 'PerplexityBot', allow: '/' },
    ],
    sitemap: `${getBaseUrl()}/sitemap.xml`,
  };
}
