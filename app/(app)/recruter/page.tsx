import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Recruter un alternant',
  description: 'Trouve des alternants qui cherchent dans ton domaine et ta ville, et écris-leur directement. Entreprises vérifiées uniquement.',
};

const STEPS = [
  ['Inscris ton entreprise', 'Un compte, ton SIRET. On vérifie à la main.'],
  ['Cherche', 'Par domaine, ville, niveau et date de début. Seuls les alternants qui l’ont accepté apparaissent.'],
  ['Écris', 'Ton message part par e-mail. La réponse arrive directement chez toi.'],
  ['Ou lance une campagne', 'Plusieurs postes, une date limite. Elle s’affiche sur la page Campagnes et sur les offres.'],
] as const;

export default function RecruitPage() {
  return (
    <div className="screen c-screen">
      <div className="c-main">
        <h1 className="c-charte__title">Tu cherches un alternant ?</h1>
        <p className="c-profile__bio">Des alternants qui cherchent vraiment. Sans école ni intermédiaire.</p>
        <ol className="c-charte">
          {STEPS.map(([title, text]) => (
            <li key={title}>
              <strong>{title}</strong>
              <span>{text}</span>
            </li>
          ))}
        </ol>
        <p>
          <Link href="/recruteur" className="btn">
            Accéder à l’espace entreprise
          </Link>
        </p>
        <p className="c-note">
          Gratuit au lancement. 20 messages par jour, un par alternant et par semaine. Pas d’écoles qui recrutent des inscrits.
        </p>
      </div>
    </div>
  );
}
