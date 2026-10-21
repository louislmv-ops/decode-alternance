import Link from 'next/link';

// La marque construite en blocs : chaque lettre évidée dans son propre trait de surligneur.
const VIEW_W = 1200;
const VIEW_H = 300;
const GAP = 4;
const SLANT = 30;
const BLOCK_W = (VIEW_W - GAP * 5) / 6;
const LETTERS = [
  { l: 'd', h: 1, ink: true },
  { l: 'é', h: 0.78, ink: false },
  { l: 'c', h: 0.64, ink: true },
  { l: 'o', h: 0.86, ink: false },
  { l: 'd', h: 0.72, ink: true },
  { l: 'e', h: 0.94, ink: false },
];

function Mark() {
  return (
    <svg className="site-footer__mark" viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} role="img" aria-label="décode">
      {LETTERS.map((x, i) => {
        const left = i * (BLOCK_W + GAP);
        const top = VIEW_H * (1 - x.h);
        const points = [
          [left + SLANT, top],
          [left + BLOCK_W, top],
          [left + BLOCK_W - SLANT, VIEW_H],
          [left, VIEW_H],
        ]
          .map((p) => p.join(','))
          .join(' ');
        return (
          <g key={i}>
            <polygon points={points} className={x.ink ? 'mark-ink' : 'mark-accent'} />
            <text x={left + BLOCK_W / 2} y={VIEW_H - 22} textAnchor="middle" className={x.ink ? 'mark-letter-light' : 'mark-letter-dark'}>
              {x.l}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <Mark />

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
        <Link href="/decoder" className="btn">
          Décoder une offre
        </Link>
      </div>
    </footer>
  );
}
