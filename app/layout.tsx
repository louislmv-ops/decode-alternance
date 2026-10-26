import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import './site.css';
import './app.css';
import { AccountSync } from '@/components/account/AccountSync';
import { Assistant } from '@/components/Assistant';
import { isChatConfigured } from '@/lib/assistant/chat';
import { Matcher } from '@/components/Matcher';
import { Reveal } from '@/components/Reveal';
import { isAccountsConfigured } from '@/lib/account/store';
import { SITE_URL } from '@/lib/site';
import { JsonLd } from '@/components/JsonLd';
import { siteJsonLd } from '@/lib/seo';

// Archivo ne sert plus qu'au mot « décode » du logo : la police est réduite à ces lettres (moins de 6 Ko).
const archivo = localFont({
  src: './fonts/archivo-wordmark.woff2',
  weight: '100 900',
  display: 'swap',
  variable: '--font-archivo',
  declarations: [{ prop: 'font-stretch', value: '62% 125%' }],
});

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
    <html lang="fr" className={archivo.variable} suppressHydrationWarning data-comptes={isAccountsConfigured() ? '' : undefined}>
      <head>
        {/* Les états cachés des apparitions ne s'appliquent que si le script tourne. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body>
        <JsonLd data={siteJsonLd()} />
        {children}
        <Matcher />
        <AccountSync />
        <Reveal />
        {isChatConfigured() && <Assistant />}
      </body>
    </html>
  );
}
