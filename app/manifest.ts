import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Décode : l’alternance, sans le blabla',
    short_name: 'Décode',
    description: 'Les offres d’alternance traduites : missions, salaire minimum, qui contacter.',
    start_url: '/offres',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0b6b4b',
    lang: 'fr',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
