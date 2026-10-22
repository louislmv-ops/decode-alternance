/** L'adresse publique du site, pour les liens absolus (sitemap, partage). À changer le jour où le domaine .fr est branché. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://decode-alternance.vercel.app').replace(/\/$/, '');
