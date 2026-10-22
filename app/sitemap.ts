import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: [string, number][] = [
    ['', 1],
    ['/offres', 0.9],
    ['/decoder', 0.8],
    ['/salaire', 0.8],
    ['/equipe', 0.7],
    ['/campagnes', 0.7],
    ['/entreprises', 0.8],
    ['/recruter', 0.5],
    ['/mentions-legales', 0.2],
  ];
  return pages.map(([path, priority]) => ({ url: `${SITE_URL}${path}`, changeFrequency: 'daily', priority }));
}
