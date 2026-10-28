/** L'adresse publique du site, pour les liens absolus (sitemap, liens canoniques, partage). L'ancien domaine avec accent y redirige. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.decode-alternance.fr').replace(/\/$/, '');
