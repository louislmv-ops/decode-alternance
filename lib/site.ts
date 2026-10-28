/** L'adresse publique du site, pour les liens absolus (sitemap, liens canoniques, partage). Les autres domaines y redirigent (next.config.ts). */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://xn--dcode-alternance-bqb.fr').replace(/\/$/, '');
