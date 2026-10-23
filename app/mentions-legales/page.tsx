import type { Metadata } from 'next';
import { SiteFooter } from '@/components/site/SiteFooter';
import { SiteNav } from '@/components/site/SiteNav';
import { SMIC } from '@/lib/rules/reference';

export const metadata: Metadata = { title: 'Mentions légales', description: 'Éditeur, hébergeur, données personnelles et sources des offres et des règles de Décode.' };

// Les informations de l'éditeur se règlent dans les variables d'environnement, sans toucher au code.
// Sans elles, le site est présenté comme édité par un particulier à titre non professionnel, qui peut
// rester anonyme en ne publiant que l'identité de l'hébergeur (LCEN, art. 6). Ce n'est plus possible
// dès qu'il y a une activité commerciale : Décode Pro exige alors les vraies informations.
const LEGAL = {
  editor: process.env.LEGAL_EDITOR || null,
  address: process.env.LEGAL_ADDRESS || null,
  siren: process.env.LEGAL_SIREN || null,
  director: process.env.LEGAL_DIRECTOR || process.env.LEGAL_EDITOR || null,
  contact: process.env.LEGAL_CONTACT || process.env.NEXT_PUBLIC_CONTACT_EMAIL || null,
};

export default function LegalPage() {
  return (
    <>
      <SiteNav />
      <main className="prose-page">
        <h1>Mentions légales</h1>
        {LEGAL.editor ? (
          <p>
            Éditeur du site : {[LEGAL.editor, LEGAL.address, LEGAL.siren ? `SIREN ${LEGAL.siren}` : null].filter(Boolean).join(', ')}. Directeur de la
            publication : {LEGAL.director}.{LEGAL.contact && ` Contact : ${LEGAL.contact}.`}
          </p>
        ) : (
          <p>
            Ce site est édité par un particulier, à titre non professionnel. Conformément à l’article 6 de la loi n° 2004-575 du 21 juin
            2004 pour la confiance dans l’économie numérique, ses éléments d’identification ont été communiqués à l’hébergeur, qui peut les
            transmettre à l’autorité judiciaire.{LEGAL.contact && ` Contact : ${LEGAL.contact}.`}
          </p>
        )}
        <p>Hébergeur : Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis (vercel.com).</p>

        <h2>Ce que Décode fait, et ne fait pas</h2>
        <p>
          Décode aide à comprendre des offres d’alternance et à s’organiser pour postuler. Décode ne garantit ni contrat, ni entretien, ni
          réponse, et n’est pas un intermédiaire de recrutement : on postule toujours sur le site d’origine de l’offre.
        </p>

        <h2 id="donnees">Données personnelles</h2>
        <p>
          Ton profil et ton suivi de candidatures sont enregistrés dans ton navigateur (stockage local) et ne sont pas envoyés à
          Décode. Un cookie technique garde ton âge, ton année et ton type de contrat pour afficher les salaires comparés à ton minimum.
        </p>
        <p>
          Quand tu colles une offre pour la traduire, son texte est envoyé à notre fournisseur d’intelligence artificielle (Anthropic)
          pour être traité, puis Décode ne le conserve pas. N’y colle pas tes coordonnées.
        </p>
        <p>Décode ne lit aucune donnée sur LinkedIn et ne contacte personne à ta place.</p>

        <h2 id="communaute">La commu</h2>
        <p>
          Les messages sont publiés par leurs auteurs, sous leur responsabilité, dans le respect de la charte. Pour signaler un contenu
          illicite : bouton « Signaler » sous le message, {LEGAL.contact ? `ou écris à ${LEGAL.contact}.` : 'ou signale-le à l’hébergeur.'} Le contenu signalé est examiné et retiré s’il
          enfreint la loi ou la charte. Tu peux supprimer tes messages et ton compte à tout moment.
        </p>

        <h2 id="avis">Avis et salaires</h2>
        <p>
          Les avis et salaires sont déposés par des personnes connectées, une fois par entreprise, et publiés sans nom ni date précise.
          Chaque avis est relu avant publication : il est refusé s’il vise une personne, contient des données personnelles ou des propos
          illicites. Il repasse en relecture après trois signalements. Les moyennes ne s’affichent qu’à partir de trois réponses. Les
          avis ne sont ni payés ni triés par les entreprises. La mention « e-mail pro vérifié » signifie qu’un code a été reçu sur une
          adresse au nom de domaine indiqué, pas que l’emploi a été contrôlé.
        </p>

        <h2 id="sources">Sources des offres et des règles</h2>
        <ul className="bullets">
          <li>Offres France Travail : API Offres d’emploi, réutilisées selon la licence de France Travail, sans les coordonnées de contact.</li>
          <li>
            Offres Adzuna et Jooble : interrogées par leurs API publiques, selon leurs conditions. La candidature passe par leur lien vers
            l’annonce d’origine.
          </li>
          <li>
            Offres des sites carrière : lues dans le balisage public JobPosting que les entreprises publient pour les moteurs de recherche,
            dans le respect de leur fichier robots.txt, avec un lien vers l’offre d’origine.
          </li>
          <li>SMIC : {SMIC.source}.</li>
          <li>Rémunération : articles D6222-26, L6325-8 et D6325-15 du Code du travail.</li>
          <li>Aides à l’employeur : décret n° 2026-168 du 6 mars 2026.</li>
          <li>Délai de 3 mois sans employeur : article L6222-12-1 du Code du travail.</li>
        </ul>
      </main>
      <SiteFooter />
    </>
  );
}
