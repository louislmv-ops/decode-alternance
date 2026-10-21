import type { Metadata } from 'next';
import { SiteFooter } from '@/components/site/SiteFooter';
import { SiteNav } from '@/components/site/SiteNav';
import { SMIC } from '@/lib/rules/reference';

export const metadata: Metadata = { title: 'Mentions légales' };

export default function LegalPage() {
  return (
    <>
      <SiteNav />
      <main className="prose-page">
        <h1>Mentions légales</h1>
        <p>
          Éditeur du site : [NOM OU RAISON SOCIALE], [ADRESSE], [NUMÉRO SIREN]. Directeur de la publication : [NOM]. Hébergeur :
          [HÉBERGEUR ET ADRESSE]. Contact : [ADRESSE E-MAIL].
        </p>

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

        <h2 id="sources">Sources des offres et des règles</h2>
        <ul className="bullets">
          <li>Offres France Travail : API Offres d’emploi, réutilisées selon la licence de France Travail, sans les coordonnées de contact.</li>
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
