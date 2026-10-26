import type { MetadataRoute } from 'next';
import { isAccountsConfigured } from '@/lib/account/store';
import { isDatabaseConfigured, sitemapOffers } from '@/lib/offers/store';
import { SITE_URL } from '@/lib/site';

// Refait toutes les heures : les nouvelles offres y entrent vite.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: [string, number][] = [
    ['', 1],
    ['/offres', 0.9],
    ['/decoder', 0.8],
    ['/salaire', 0.8],
    ['/equipe', 0.7],
    ['/aides', 0.7],
    ['/mentions-legales', 0.2],
  ];
  // Ces pages ont besoin des comptes : sans eux, elles ne montreraient qu'un « bientôt ».
  if (isAccountsConfigured()) {
    pages.push(['/entreprises', 0.8], ['/campagnes', 0.7], ['/communaute', 0.6], ['/pro', 0.6], ['/recruter', 0.5]);
  }
  const now = new Date();
  const entries: MetadataRoute.Sitemap = pages.map(([path, priority]) => ({ url: `${SITE_URL}${path}`, lastModified: now, changeFrequency: 'daily', priority }));
  // Chaque offre a sa page : c'est elle que Google for Jobs et les assistants IA peuvent citer.
  const offers = isDatabaseConfigured() ? await sitemapOffers().catch(() => []) : [];
  for (const o of offers) {
    entries.push({ url: `${SITE_URL}/offres/${encodeURIComponent(o.id)}`, lastModified: o.publishedAt, changeFrequency: 'weekly', priority: 0.6 });
  }
  return entries;
}
