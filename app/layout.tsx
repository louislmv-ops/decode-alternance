import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import './site.css';
import './app.css';
import { AccountSync } from '@/components/account/AccountSync';
import { Matcher } from '@/components/Matcher';
import { Reveal } from '@/components/Reveal';
import { isAccountsConfigured } from '@/lib/account/store';
import { SITE_URL } from '@/lib/site';

// Archivo servie par Next : préchargée, avec une police de secours aux mêmes proportions,
// pour que les titres ne bougent pas quand elle arrive.
const archivo = localFont({
  // Le sous-ensemble latin couvre le français (é, ç, œ, ’…).
  src: './fonts/archivo-latin-wdth-normal.woff2',
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
    <html lang="fr" className={archivo.variable} data-comptes={isAccountsConfigured() ? '' : undefined}>
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
