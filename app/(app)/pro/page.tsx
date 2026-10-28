import type { Metadata } from 'next';
import Link from 'next/link';
import { SponsorBox } from '@/components/sponsors/SponsorBox';
import { FREE_FOR_COMPANIES, SPONSOR_FEATURES } from '@/lib/sponsors/plan';

export const metadata: Metadata = {
  title: 'Mettre tes offres d’alternance en avant',
  description:
    'Décode est gratuit pour les alternants. Les entreprises peuvent mettre leurs offres en tête des recherches, toujours signalées « Sponsorisé », et voir les alternants intéressés.',
  alternates: { canonical: '/pro' },
};

const FAQ = [
  [
    'Pourquoi Décode est gratuit pour les alternants ?',
    'Parce que ce sont les entreprises qui financent le site, en mettant leurs offres en avant. Aucun alternant ne paie, pour aucune fonction.',
  ],
  [
    'Où apparaissent mes offres ?',
    'En haut de la première page des recherches qu’elles correspondent : métier, ville, niveau. Une offre qui ne correspond pas aux filtres de l’alternant n’est jamais montrée. Deux offres sponsorisées au plus par page.',
  ],
  [
    'Les alternants savent-ils que c’est payant ?',
    'Oui. Chaque offre mise en avant porte la mention « Sponsorisé ». Le reste du classement ne dépend d’aucun paiement.',
  ],
  [
    'Qui sont les alternants intéressés ?',
    'Ceux qui ont aimé une de tes offres et qui ont accepté, par une case à part, que les entreprises concernées voient leur profil. Tu ne vois ni leur e-mail ni leurs autres likes : tu leur écris depuis Décode.',
  ],
  [
    'Est-ce que ça garantit des candidatures ?',
    'Non. La mise en avant donne de la visibilité, pas un nombre de candidatures ni un recrutement. Les vues et les clics sont comptés chaque jour pour que tu juges par toi-même.',
  ],
  ['Comment arrêter ?', 'Depuis ton tableau de bord, « Factures et résiliation ». La mise en avant continue jusqu’à la fin du mois payé, puis s’arrête.'],
] as const;

export default function SponsorPage() {
  return (
    <div className="screen c-screen">
      <div className="c-main pro">
        <h1 className="pro__title">
          Tes offres d’alternance, <span>en tête.</span>
        </h1>
        <p className="pro__lead">
          Décode est gratuit pour les alternants, et le restera. Ce sont les entreprises qui le financent, en mettant leurs offres en avant
          auprès de ceux qui les cherchent.
        </p>

        <ul className="pro__features" role="list">
          {SPONSOR_FEATURES.map(([title, text]) => (
            <li key={title}>
              <strong>{title}</strong>
              <span>{text}</span>
            </li>
          ))}
        </ul>

        <SponsorBox />

        <section className="pro__free">
          <h2>Gratuit pour toutes les entreprises vérifiées</h2>
          <ul role="list">
            {FREE_FOR_COMPANIES.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          <p>
            <Link className="link" href="/recruteur">
              Ouvrir l’espace entreprise
            </Link>
          </p>
        </section>

        <section className="pro__faq">
          <h2>Questions fréquentes</h2>
          {FAQ.map(([q, a]) => (
            <details key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </section>

        <p className="pro__small">
          <Link className="link" href="/cgv">
            Conditions de vente
          </Link>
        </p>
      </div>
    </div>
  );
}
