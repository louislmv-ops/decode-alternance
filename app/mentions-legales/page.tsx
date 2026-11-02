import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteFooter } from '@/components/site/SiteFooter';
import { SiteNav } from '@/components/site/SiteNav';
import { SMIC } from '@/lib/rules/reference';
import { contactEmail, legalAddress, legalEditor, legalSiren } from '@/lib/legal';

export const metadata: Metadata = { title: 'Mentions légales', description: 'Éditeur, hébergeur, classement et sources des offres et des règles de Décode.', alternates: { canonical: '/mentions-legales' } };

const TODO = (label: string) => `[${label} À COMPLÉTER]`;

export default function LegalPage() {
  const editor = legalEditor();
  const director = process.env.LEGAL_DIRECTOR?.trim() || editor;
  const contact = contactEmail();
  const contactText = contact ?? TODO('E-MAIL');
  return (
    <>
      <SiteNav />
      <main className="prose-page">
        <h1>Mentions légales</h1>
        <p>
          Éditeur du site : {[editor ?? TODO('NOM'), legalAddress(), `SIREN ${legalSiren() ?? TODO('SIREN')}`].filter(Boolean).join(', ')}.
          Directeur de la publication : {director ?? TODO('NOM')}. Contact : {contactText}.
        </p>
        <p>Hébergeur : Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis (vercel.com).</p>

        <h2>Ce que Décode fait, et ne fait pas</h2>
        <p>
          Décode aide à comprendre des offres d’alternance et à s’organiser pour postuler. Décode ne garantit ni contrat, ni entretien, ni
          réponse, et n’est pas un intermédiaire de recrutement : on postule toujours sur le site d’origine de l’offre.
        </p>

        <h2 id="donnees">Données personnelles</h2>
        <p>
          Ce que Décode fait de tes données, pourquoi, combien de temps, et comment exercer tes droits : tout est dans la{' '}
          <Link href="/confidentialite">politique de confidentialité</Link>.
        </p>

        <h2 id="communaute">La commu</h2>
        <p>
          Les messages sont publiés par leurs auteurs, sous leur responsabilité, dans le respect de la charte. Pour signaler un contenu
          illicite : bouton « Signaler » sous le message, {contact ? `ou écris à ${contact}.` : 'ou signale-le à l’hébergeur.'} Le contenu signalé est examiné et retiré s’il
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

        <h2 id="classement">Classement des offres</h2>
        <p>
          Par défaut, les offres sont classées selon des critères identiques pour toutes : salaire annoncé, niveau de diplôme, intitulé
          du poste, taille et notoriété de l’employeur, candidature directe et date de publication. Dans ce tri, un même employeur (un
          groupe et ses filiales comptent pour un) a au plus deux offres par page de 20 : ses offres suivantes passent après les
          meilleures des autres employeurs, sauf en fin de liste, quand il ne reste plus assez d’employeurs différents. Sur l’accueil,
          une seule offre par employeur. Tu peux aussi trier par date ou par salaire, sans ce plafond.
        </p>
        <p>
          Les entreprises peuvent payer une mise en avant : au plus deux de leurs offres en haut de la première page, seulement quand
          elles correspondent à ta recherche. Ces offres portent toujours la mention « Sponsorisé ». Aucun autre paiement n’influence le
          classement, les avis ni la mention « Pépite » (article L111-7 du Code de la consommation).
        </p>

        <h2 id="sources">Sources des offres et des règles</h2>
        <ul className="bullets">
          <li>Offres France Travail : API Offres d’emploi, réutilisées selon la licence de France Travail, sans les coordonnées de contact.</li>
          <li>
            Offres La bonne alternance : API Apprentissage du ministère du Travail, réutilisées selon ses conditions, avec lien vers
            l’offre pour postuler.
          </li>
          <li>
            Offres Adzuna et Jooble : interrogées par leurs API publiques, selon leurs conditions. La candidature passe par leur lien vers
            l’annonce d’origine.
          </li>
          <li>
            Offres des sites carrière : lues dans le balisage public JobPosting que les entreprises publient pour les moteurs de recherche,
            dans le respect de leur fichier robots.txt, avec un lien vers l’offre d’origine.
          </li>
          <li>
            Liste des écoles et organismes de formation écartés des offres : reprise du dépôt public de La bonne alternance
            (mission-apprentissage/labonnealternance), © 2023 La bonne alternance, licence MIT.
          </li>
          <li>Département à partir de ta position : API Géo de l’État (geo.api.gouv.fr). La position n’est pas conservée.</li>
          <li>Secteurs : codes ROME du métier, donnés par France Travail et La bonne alternance.</li>
          <li>SMIC : {SMIC.source}.</li>
          <li>Rémunération : articles D6222-26, L6325-8 et D6325-15 du Code du travail.</li>
          <li>Aides à l’employeur : décret n° 2026-168 du 6 mars 2026 (aide exceptionnelle) et aide unique aux employeurs d’apprentis.</li>
          <li>Délai de 3 mois sans employeur : article L6222-12-1 du Code du travail.</li>
          <li>Emoji 3D : Fluent Emoji de Microsoft, © Microsoft Corporation, licence MIT.</li>
        </ul>
      </main>
      <SiteFooter />
    </>
  );
}
