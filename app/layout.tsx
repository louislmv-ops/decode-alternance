import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/archivo/wdth.css';
import './globals.css';
import './site.css';
import './app.css';
import { AccountSync } from '@/components/account/AccountSync';
import { Matcher } from '@/components/Matcher';
import { Reveal } from '@/components/Reveal';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: { default: 'Décode : l’alternance, en clair', template: '%s · Décode' },
  description:
    'Les offres d’alternance traduites : ce que tu feras vraiment, ton salaire minimum garanti, les fausses offres d’écoles écartées et qui contacter dans l’équipe.',
  metadataBase: new URL(SITE_URL),
  openGraph: { type: 'website', locale: 'fr_FR', siteName: 'Décode' },
  appleWebApp: { capable: true, title: 'Décode', statusBarStyle: 'default' },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        {/* Les états cachés des apparitions ne s'appliquent que si le script tourne. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body>
        {children}
        <Matcher />
        <AccountSync />
        <Reveal />
      </body>
    </html>
  );
}
