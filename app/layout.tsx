import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/bricolage-grotesque/opsz.css';
import '@fontsource-variable/figtree/wght.css';
import './globals.css';
import './site.css';
import './app.css';
import { Reveal } from '@/components/Reveal';

export const metadata: Metadata = {
  title: { default: 'Décode : l’alternance, en clair', template: '%s · Décode' },
  description:
    'Colle n’importe quelle offre d’alternance : Décode te dit ce que tu feras vraiment, ton salaire minimum garanti et à qui écrire dans l’équipe.',
};

export const viewport: Viewport = {
  themeColor: '#0b6b4b',
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
        <Reveal />
      </body>
    </html>
  );
}
