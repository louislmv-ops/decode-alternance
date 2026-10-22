import Link from 'next/link';
import { Wordmark } from '@/components/Wordmark';

export function SiteFooter() {
  return (
    <footer className="site-footer">
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
          <Link className="link" href="/entreprises">
            Recruter un alternant
          </Link>
        </nav>
        <nav aria-label="Infos" className="site-footer__col">
          <p className="site-footer__label">Infos</p>
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
