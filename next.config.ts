import type { NextConfig } from 'next';

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
];

/** L'adresse officielle du site. Vercel y envoie déjà decode-alternance.fr (sans www). */
const MAIN_HOST = 'https://www.decode-alternance.fr';

/** L'ancien domaine avec accent (décode-alternance.fr, écrit en punycode) : un seul site pour Google, pas deux. */
const OLD_HOSTS = ['xn--dcode-alternance-bqb.fr', 'www.xn--dcode-alternance-bqb.fr'];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // La photo de l'accueil est servie en qualité 85 : nette sur écran Retina, toujours légère.
  images: { qualities: [75, 85] },
  async redirects() {
    return OLD_HOSTS.map((host) => ({
      source: '/:path*',
      has: [{ type: 'host' as const, value: host }],
      destination: `${MAIN_HOST}/:path*`,
      permanent: true,
    }));
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
