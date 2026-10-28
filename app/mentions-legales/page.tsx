import type { Metadata } from 'next';
import { SiteFooter } from '@/components/site/SiteFooter';
import { SiteNav } from '@/components/site/SiteNav';
import { SMIC } from '@/lib/rules/reference';
import { aiProvider, contactEmail, databaseHost, legalAddress, legalEditor, legalSiren } from '@/lib/legal';

export const metadata: Metadata = { title: 'Mentions légales', description: 'Éditeur, hébergeur, données personnelles et sources des offres et des règles de Décode.', alternates: { canonical: '/mentions-legales' } };

const TODO = (label: string) => `[${label} À COMPLÉTER]`;

export default function LegalPage() {
  const editor = legalEditor();
  const director = process.env.LEGAL_DIRECTOR?.trim() || editor;
  const contact = contactEmail();
  const ai = aiProvider();
  const db = databaseHost();
  const contactText = contact ?? TODO('E-MAIL');
  return (
    <>
      <SiteNav />
      <main className="prose-page">
        <h1>Mentions légales</h1>
        <p>
          Éditeur du site : {editor ?? TODO('NOM')}, entrepreneur individuel, {legalAddress() ?? TODO('ADRESSE')}, SIREN {legalSiren() ?? TODO('SIREN')}.
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
          Responsable du traitement : l’éditeur du site, joignable à {contactText}. Cette section décrit ce que le code du site fait
          réellement de tes données.
        </p>

        <h3>Sans compte</h3>
        <p>
          Ton profil, ton suivi de candidatures et tes likes restent dans ton navigateur (stockage local) et ne sont pas envoyés à
          Décode. Un cookie technique garde ton âge, ton année et ton type de contrat pour comparer les salaires à ton minimum, un autre
          ton département si tu le choisis. Le site n’utilise ni cookie publicitaire ni outil de mesure d’audience ; les vues et clics des offres sponsorisées sont comptés en total par jour, sans rien qui t’identifie.
        </p>

        <h3>Ce que Décode traite, pourquoi, et combien de temps</h3>
        <ul className="bullets">
          <li>
            <strong>Ton compte</strong> (adresse e-mail, profil, suivi, likes, dossier de candidature, numéro de portable si tu
            l’ajoutes) : pour te retrouver sur tous tes appareils et t’envoyer les alertes que tu as choisies. Base légale : l’exécution
            du service que tu demandes en créant ton compte ; pour les alertes par e-mail ou SMS, ton accord, que tu retires depuis Mon
            compte. Conservation : tant que ton compte existe. Le code de connexion expire après 10 minutes, la session après 90 jours.
          </li>
          <li>
            <strong>Ton CV</strong>, si tu l’enregistres dans ton compte : pour préparer tes candidatures. Base légale : l’exécution du
            service. Conservation : jusqu’à ce que tu le supprimes, ou ton compte. Un CV envoyé seulement pour remplir ton profil est lu
            puis oublié, sans être enregistré.
          </li>
          <li>
            <strong>Le décodeur</strong> : le texte que tu colles est envoyé au fournisseur d’IA pour être traduit, puis Décode ne le
            conserve pas, ni en base ni dans ses journaux. Les traductions des offres de la liste (des annonces publiques) sont gardées
            pour les visiteurs suivants. Base légale : l’exécution du service que tu demandes.
          </li>
          <li>
            <strong>Les avis et salaires</strong> : publiés sans nom, rattachés à ton compte pour qu’il n’y en ait qu’un par entreprise.
            Base légale : l’intérêt légitime d’informer les autres alternants. Conservation : tant que ton compte existe, ou jusqu’à ce
            que tu les retires.
          </li>
          <li>
            <strong>La commu</strong> (pseudo, messages, likes, abonnements, signalements) : pour faire vivre les échanges. Base légale :
            l’exécution du service. Conservation : jusqu’à ce que tu supprimes tes messages ou ton compte.
          </li>
          <li>
            <strong>L’assistant</strong> : la conversation est envoyée au fournisseur d’IA pour obtenir la réponse. Décode ne la conserve
            pas sur ses serveurs : elle reste dans ton navigateur le temps de ta visite.
          </li>
          <li>
            <strong>La sécurité</strong> : ton adresse IP sert à limiter le nombre de demandes (décodeur, CV), en mémoire du serveur seulement,
            jamais en base, et elle est effacée à son redémarrage. L’hébergeur tient ses propres journaux techniques. Base légale : l’intérêt légitime de protéger le service.
          </li>
          <li>
            <strong>Décode Pro</strong>, si tu t’abonnes : le paiement est traité par Stripe ; Décode ne voit jamais ton numéro de carte.
            Les factures sont gardées le temps imposé par la loi.
          </li>
        </ul>
        <p>Supprimer ton compte depuis Mon compte efface aussi ton CV, tes avis, tes salaires déposés, ton profil de la commu et tes messages.</p>

        <h3>Qui reçoit tes données</h3>
        <ul className="bullets">
          <li>Vercel (hébergement du site), États-Unis.</li>
          <li>La base de données{db ? ` : ${db}` : ''}.</li>
          <li>
            Le fournisseur d’IA{ai ? ` (${ai.name})` : ''}, pour le décodeur, l’assistant et, avec Anthropic seulement, la lecture des CV.
            {ai?.freeTier &&
              ' Avec l’offre gratuite de ce fournisseur, le texte envoyé peut servir à améliorer ses modèles : n’y colle jamais tes coordonnées. Ton CV n’est jamais envoyé à une IA gratuite.'}
          </li>
          <li>Resend (envoi des e-mails) et Brevo (envoi des SMS), seulement si tu actives ces alertes.</li>
          <li>Stripe (paiement de Décode Pro), seulement si tu t’abonnes.</li>
        </ul>
        <p>
          Tes données ne sont ni vendues ni transmises à des recruteurs : c’est toi qui postules, sur le site de l’offre. Plusieurs de ces
          prestataires sont établis aux États-Unis : les transferts reposent sur les garanties prévues par le RGPD que chacun propose
          (décision d’adéquation UE-États-Unis pour les entreprises certifiées, ou clauses contractuelles types de la Commission
          européenne).
        </p>

        <h3>Tes droits</h3>
        <p>
          Tu peux accéder à tes données, les corriger, les supprimer, t’opposer à un traitement fondé sur l’intérêt légitime, en limiter
          l’usage et en recevoir une copie dans un format lisible par une machine (portabilité). Pour supprimer ton CV ou tout ton compte,
          le bouton est dans Mon compte. Pour tout le reste, écris à {contactText} : réponse sous un mois. Si tu estimes que tes droits ne
          sont pas respectés, tu peux adresser une réclamation à la CNIL (cnil.fr).
        </p>
        <p>Décode ne lit aucune donnée sur LinkedIn et ne contacte personne à ta place.</p>

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
          du poste, taille et notoriété de l’employeur, candidature directe et date de publication. Les premières places évitent de montrer
          plusieurs fois le même employeur. Tu peux aussi trier par date ou par salaire.
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
