import Link from 'next/link';
import { Wordmark } from '@/components/Wordmark';

export function SiteNav() {
  return (
    <header className="site-nav">
      <Link href="/" className="site-nav__brand" aria-label="Décode, accueil">
        <Wordmark />
      </Link>
      <nav aria-label="Principale" className="site-nav__links">
        <Link className="link" href="/offres">
          Offres
        </Link>
        <Link className="link" href="/salaire">
          Salaire
        </Link>
        <Link className="link" href="/equipe">
          LinkedIn
        </Link>
        <Link className="link" href="/suivi">
          Suivi
        </Link>
      </nav>
      <Link href="/decoder" className="btn btn--small site-nav__action">
        Décoder une offre
      </Link>
    </header>
  );
}
