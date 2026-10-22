import type { Metadata } from 'next';
import { BackLink } from '@/components/BackLink';

export const metadata: Metadata = { title: 'La charte de la commu' };

const RULES = [
  ['Respect', 'Pas d’insulte, de harcèlement, de moquerie, de discrimination.'],
  ['Vrai', 'Partage ce que tu as vécu. Pas de fausse info, pas de faux avis.'],
  ['Pas de données perso', 'Ni les tiennes ni celles des autres : pas de numéro, d’adresse, de nom de recruteur.'],
  ['Pas de pub', 'Pas d’école qui recrute, pas de formation payante, pas de lien vendeur.'],
  ['Signale', 'Un message qui dérange ? « ··· » puis « Signaler ». Trois signalements et il est masqué.'],
] as const;

export default function CharterPage() {
  return (
    <div className="screen c-screen">
      <div className="back-row">
        <BackLink fallback="/communaute" label="La commu" />
      </div>
      <div className="c-main">
        <h1 className="c-charte__title">La charte</h1>
        <ol className="c-charte">
          {RULES.map(([title, text]) => (
            <li key={title}>
              <strong>{title}</strong>
              <span>{text}</span>
            </li>
          ))}
        </ol>
        <p className="c-note">Un message qui ne respecte pas la charte peut être supprimé, et son auteur exclu. Tu peux supprimer tes messages à tout moment.</p>
      </div>
    </div>
  );
}
