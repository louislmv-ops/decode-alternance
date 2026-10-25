/** L'adresse publique du site, pour les liens absolus (sitemap, partage) : décode-alternance.fr, écrit en punycode. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://xn--dcode-alternance-bqb.fr').replace(/\/$/, '');
