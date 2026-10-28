import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Les aides pour les alternants',
  description: 'Logement, impôts, permis, réductions : les aides auxquelles un alternant peut avoir droit, en clair, avec le lien officiel pour chacune.',
  alternates: { canonical: '/aides' },
};

/** Vérifié en octobre 2026. Les montants changent : chaque aide renvoie vers sa source officielle. */
const AIDES = [
  {
    for: 'Alternance',
    title: 'Mobili-Jeune : une partie de ton loyer',
    text: '10 à 100 € par mois si tu as moins de 30 ans. Demande-la tôt : il y a un délai.',
    href: 'https://www.actionlogement.fr',
    source: 'Action Logement',
  },
  {
    for: 'Tous',
    title: 'APL : l’aide au logement de la CAF',
    text: 'Selon ton loyer et tes revenus. Simulation en 5 minutes.',
    href: 'https://www.caf.fr',
    source: 'CAF',
  },
  {
    for: 'Tous',
    title: 'Prime d’activité',
    text: 'Possible même en alternance, selon ton salaire.',
    href: 'https://www.caf.fr',
    source: 'CAF',
  },
  {
    for: 'Apprentissage seulement',
    title: 'Pas d’impôt sur ton salaire',
    text: 'Pas imposable jusqu’au SMIC annuel. À déclarer quand même.',
    href: 'https://www.impots.gouv.fr',
    source: 'impots.gouv.fr',
  },
  {
    for: 'Apprentissage seulement',
    title: 'Permis de conduire',
    text: 'L’aide de 500 € n’existe plus en 2026. Reste le permis à 1 € par jour et les aides régionales.',
    href: 'https://www.service-public.fr',
    source: 'Service-public.fr',
  },
  {
    for: 'Apprentissage seulement',
    title: 'Carte d’étudiant des métiers',
    text: 'Donnée par ton CFA : réductions étudiantes (transports, ciné, resto U).',
    href: 'https://www.service-public.fr',
    source: 'Service-public.fr',
  },
  {
    for: 'Alternance',
    title: 'Les aides de ta région',
    text: 'Transport, logement, équipement : chaque région a les siennes.',
    href: 'https://www.1jeune1solution.gouv.fr/mes-aides',
    source: '1jeune1solution',
  },
] as const;

export default function AidesPage() {
  return (
    <div className="screen c-screen">
      <div className="c-main">
        <h1 className="c-charte__title">Tes aides</h1>
        <p className="c-profile__bio">En plus de ton salaire.</p>
        <ol className="c-charte">
          {AIDES.map((a) => (
            <li key={a.title}>
              <strong>
                {a.title} <span className="aides__for">{a.for}</span>
              </strong>
              <span>{a.text}</span>
              <a className="link aides__src" href={a.href} target="_blank" rel="noopener noreferrer">
                {a.source}
              </a>
            </li>
          ))}
        </ol>
        <p className="c-note">
          Tout vérifier d’un coup : <a href="https://www.1jeune1solution.gouv.fr/mes-aides" target="_blank" rel="noopener noreferrer" className="link">1jeune1solution</a>. Ton salaire : <Link href="/salaire">ici</Link>.
        </p>
        <p className="c-note">Vérifié en octobre 2026. La source officielle fait foi.</p>
      </div>
    </div>
  );
}
