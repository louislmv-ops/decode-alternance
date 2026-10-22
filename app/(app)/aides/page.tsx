import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Les aides pour les alternants',
  description: 'Logement, impôts, permis, réductions : les aides auxquelles un alternant peut avoir droit, en clair, avec le lien officiel pour chacune.',
};

/** Vérifié en octobre 2026. Les montants changent : chaque aide renvoie vers sa source officielle. */
const AIDES = [
  {
    title: 'Mobili-Jeune : une partie de ton loyer',
    text: 'De 10 à 100 € par mois, si tu as moins de 30 ans et que ton entreprise est du secteur privé non agricole. Fais la demande tôt : il y a un délai à respecter autour du début du contrat.',
    href: 'https://www.actionlogement.fr',
    source: 'Action Logement',
  },
  {
    title: 'APL : l’aide au logement de la CAF',
    text: 'Elle dépend de ton loyer et de tes revenus. Fais la simulation, ça prend cinq minutes.',
    href: 'https://www.caf.fr',
    source: 'CAF',
  },
  {
    title: 'Prime d’activité',
    text: 'Selon ton salaire, tu peux y avoir droit même en alternance. Simulation sur le site de la CAF.',
    href: 'https://www.caf.fr',
    source: 'CAF',
  },
  {
    title: 'Pas d’impôt sur ton salaire d’apprenti',
    text: 'Ton salaire d’apprenti n’est pas imposable jusqu’au montant annuel du SMIC. Tu le déclares quand même.',
    href: 'https://www.impots.gouv.fr',
    source: 'impots.gouv.fr',
  },
  {
    title: 'Permis de conduire',
    text: 'L’aide nationale de 500 € pour les apprentis a été supprimée par la loi de finances 2026. Restent le permis à 1 € par jour et les aides de ta région.',
    href: 'https://www.service-public.fr',
    source: 'Service-public.fr',
  },
  {
    title: 'Carte d’étudiant des métiers',
    text: 'En apprentissage, ton CFA te la remet : elle donne accès aux réductions étudiantes (transports, cinéma, restaurants universitaires…).',
    href: 'https://www.service-public.fr',
    source: 'Service-public.fr',
  },
  {
    title: 'Les aides de ta région',
    text: 'Transport, hébergement, premier équipement : chaque région a les siennes. Regarde sur le site de ta région, rubrique apprentissage.',
    href: 'https://www.1jeune1solution.gouv.fr/mes-aides',
    source: '1jeune1solution',
  },
] as const;

export default function AidesPage() {
  return (
    <div className="screen c-screen">
      <div className="c-main">
        <h1 className="c-charte__title">Tes aides</h1>
        <p className="c-profile__bio">Ce à quoi tu peux avoir droit en alternance, en plus de ton salaire.</p>
        <ol className="c-charte">
          {AIDES.map((a) => (
            <li key={a.title}>
              <strong>{a.title}</strong>
              <span>{a.text}</span>
              <a className="link aides__src" href={a.href} target="_blank" rel="noopener noreferrer">
                Vérifier sur {a.source}
              </a>
            </li>
          ))}
        </ol>
        <p className="c-note">
          Le simulateur officiel <a href="https://www.1jeune1solution.gouv.fr/mes-aides" target="_blank" rel="noopener noreferrer" className="link">1jeune1solution</a> fait le
          tour de tes droits en quelques questions. Ton salaire minimum, lui, se calcule <Link href="/salaire">ici</Link>.
        </p>
        <p className="c-note">Vérifié en octobre 2026. Les montants et les conditions changent : la source officielle fait foi.</p>
      </div>
    </div>
  );
}
