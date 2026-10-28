import Link from 'next/link';
import { Wordmark } from '@/components/Wordmark';
import { CITIES, landingHref } from '@/lib/landing';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      {/* Décode passe la tête au-dessus du pied de page, comme Freddie chez Mailchimp. */}
      <span className="site-footer__peek" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/decode/clin-oeil-256.webp" alt="" width={256} height={256} loading="lazy" />
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
        <nav aria-label="Alternance par ville" className="site-footer__col">
          <p className="site-footer__label">Par ville</p>
          {CITIES.slice(0, 6).map((c) => (
            <Link key={c.slug} className="link" href={landingHref(null, c)}>
              Alternance à {c.name}
            </Link>
          ))}
          <Link className="link" href="/alternance">
            Tous les métiers et villes
          </Link>
        </nav>
        <nav aria-label="Infos" className="site-footer__col">
          <p className="site-footer__label">Infos</p>
          <Link className="link" href="/pro" data-needs="comptes">
            Entreprises : mettre ses offres en avant
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
          <p>Décode ne garantit ni contrat, ni entretien, ni réponse.</p>
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
