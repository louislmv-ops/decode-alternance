import type { NextConfig } from 'next';

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
];

/**
 * L'adresse officielle du site, celle de NEXT_PUBLIC_SITE_URL. Les autres domaines de Décode y renvoient, pour qu'il n'y
 * ait qu'un site aux yeux de Google. Tant que decode-alternance.fr (sans accent) n'est pas acheté, l'adresse officielle
 * reste décode-alternance.fr (avec accent, écrit en punycode) : rediriger vers un domaine qui n'existe pas couperait le site.
 */
const MAIN_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://xn--dcode-alternance-bqb.fr').replace(/\/$/, '');
const MAIN_HOST = new URL(MAIN_URL).host;
const DOMAINS = ['xn--dcode-alternance-bqb.fr', 'www.xn--dcode-alternance-bqb.fr', 'decode-alternance.fr', 'www.decode-alternance.fr'];
const OTHER_HOSTS = DOMAINS.filter((host) => host !== MAIN_HOST);
/**
 * L'adresse Vercel du projet sert aussi le site : on la renvoie vers l'adresse officielle pour éviter un doublon dans Google.
 * Sauf /api/ : le cron Vercel et les webhooks peuvent l'appeler, et une redirection les casserait. Les aperçus de PR ont
 * d'autres adresses et ne sont pas concernés.
 */
const VERCEL_HOST = 'decode-alternance.vercel.app';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // La photo de l'accueil est servie en qualité 85 : nette sur écran Retina, toujours légère.
  images: { qualities: [75, 85] },
  async redirects() {
    return [
      ...OTHER_HOSTS.map((host) => ({
        source: '/:path*',
        has: [{ type: 'host' as const, value: host }],
        destination: `${MAIN_URL}/:path*`,
        permanent: true,
      })),
      ...(MAIN_HOST === VERCEL_HOST
        ? []
        : [
            {
              source: '/:path((?!api/).*)',
              has: [{ type: 'host' as const, value: VERCEL_HOST }],
              destination: `${MAIN_URL}/:path`,
              permanent: true,
            },
          ]),
    ];
  },
  async headers() {
    // Les images de la mascotte et les emoji changent rarement : un jour en cache, puis rafraîchies en arrière-plan.
    const assets = [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }];
    return [
      { source: '/:path*', headers: securityHeaders },
      { source: '/decode/:path*', headers: assets },
      { source: '/emoji/:path*', headers: assets },
    ];
  },
};

export default nextConfig;
