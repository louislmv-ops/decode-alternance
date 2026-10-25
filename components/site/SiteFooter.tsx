import Link from 'next/link';
import { Wordmark } from '@/components/Wordmark';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      {/* Décode passe la tête au-dessus du pied de page, comme Freddie chez Mailchimp. */}
      <span className="site-footer__peek" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/decode/clin-oeil.webp" alt="" width={768} height={768} loading="lazy" />
      </span>
      <p className="site-footer__mark" aria-hidden="true">
        <Wordmark />
      </p>

      <div className="site-footer__cols">
        <nav aria-label="Outils" className="site-footer__col">
          <p className="site-footer__label">Outils</p>
          <Link className="link" href="/offres">
            Offres d’alternance
          </Link>
          <Link className="link" href="/decoder">
            Décoder une offre
          </Link>
          <Link className="link" href="/salaire">
            Salaire minimum
          </Link>
          <Link className="link" href="/equipe">
            Trouver l’équipe
          </Link>
          <Link className="link" href="/suivi">
            Suivi des candidatures
          </Link>
          <Link className="link" href="/aides">
            Tes aides
          </Link>
          <Link className="link" href="/campagnes" data-needs="comptes">
            Campagnes d’alternance
          </Link>
          <Link className="link" href="/recruter" data-needs="comptes">
            Recruter un alternant
          </Link>
        </nav>
        <nav aria-label="Infos" className="site-footer__col">
          <p className="site-footer__label">Infos</p>
          <Link className="link" href="/pro" data-needs="comptes">
            Décode Pro
          </Link>
          <Link className="link" href="/cgv" data-needs="comptes">
            Conditions de vente
          </Link>
          <Link className="link" href="/mentions-legales">
            Mentions légales
          </Link>
          <Link className="link" href="/mentions-legales#donnees">
            Données personnelles
          </Link>
          <Link className="link" href="/mentions-legales#sources">
            Sources des offres et des règles
          </Link>
        </nav>
        <div className="site-footer__note">
          <p>Décode ne garantit ni contrat, ni entretien, ni réponse. Il t’aide à comprendre les offres et à bien t’y prendre.</p>
          <p>Salaires calculés sur le SMIC en vigueur et le Code du travail.</p>
        </div>
      </div>

      <div className="site-footer__last">
        <p>© 2026 Décode</p>
        <Link href="/decoder" className="btn btn--accent">
          Décoder une offre
        </Link>
      </div>
    </footer>
  );
}
