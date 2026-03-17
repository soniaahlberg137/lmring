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
      { userAgent: 'OAI-SearchBot', allow: '/' },
      { userAgent: 'ChatGPT-User', allow: '/' },
      { userAgent: 'ClaudeBot', allow: '/' },
      { userAgent: 'PerplexityBot', allow: '/' },
      { userAgent: 'Google-Extended', allow: '/' },
      { userAgent: 'GoogleOther', allow: '/' },
      { userAgent: 'Applebot-Extended', allow: '/' },
      { userAgent: 'Amazonbot', allow: '/' },
      { userAgent: 'FacebookBot', allow: '/' },
      { userAgent: 'Bytespider', disallow: '/' },
    ],
    sitemap: `${getBaseUrl()}/sitemap.xml`,
  };
}
