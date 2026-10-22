import type { MetadataRoute } from 'next';
import { isAccountsConfigured } from '@/lib/account/store';
import { SITE_URL } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
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
    pages.push(['/entreprises', 0.8], ['/campagnes', 0.7], ['/pro', 0.6], ['/recruter', 0.5]);
  }
  return pages.map(([path, priority]) => ({ url: `${SITE_URL}${path}`, changeFrequency: 'daily', priority }));
}
