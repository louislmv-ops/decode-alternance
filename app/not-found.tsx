import Link from 'next/link';
import { Mascotte } from '@/components/Mascotte';
import { SiteFooter } from '@/components/site/SiteFooter';
import { SiteNav } from '@/components/site/SiteNav';

export default function NotFound() {
  return (
    <>
      <SiteNav />
      <main className="prose-page lost">
        <Mascotte pose="pense" size={160} className="lost__mascotte" eager />
        <h1>Cette page n’existe pas</h1>
        <p>L’offre a peut-être été retirée par l’entreprise, ou le lien est incomplet.</p>
        <p className="lost__links">
          <Link className="btn" href="/offres">
            Voir les offres
          </Link>
          <Link className="link" href="/">
            Retour à l’accueil
          </Link>
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
