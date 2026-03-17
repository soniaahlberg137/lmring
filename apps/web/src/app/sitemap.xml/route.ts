import sitemapData from '../sitemap-data';

function generateSitemapXml(): string {
  const entries = sitemapData();

  const urls = entries
    .map(
      (entry) =>
        `<url>
<loc>${entry.url}</loc>${entry.lastModified ? `\n<lastmod>${entry.lastModified instanceof Date ? entry.lastModified.toISOString() : entry.lastModified}</lastmod>` : ''}${entry.changeFrequency ? `\n<changefreq>${entry.changeFrequency}</changefreq>` : ''}${entry.priority != null ? `\n<priority>${entry.priority}</priority>` : ''}
</url>`,
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

function respond() {
  const xml = generateSitemapXml();
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}

export const GET = respond;
export const POST = respond;
