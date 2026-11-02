import type { Metadata } from 'next';
import { SiteFooter } from '@/components/site/SiteFooter';
import { SiteNav } from '@/components/site/SiteNav';
import { aiProvider, contactEmail, databaseHost } from '@/lib/legal';

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
  description: 'Ce que Décode fait de tes données : finalités, base légale, durées, destinataires, cookies et tes droits.',
  alternates: { canonical: '/confidentialite' },
};

export default function PrivacyPage() {
  const contactText = contactEmail() ?? '[E-MAIL À COMPLÉTER]';
  const ai = aiProvider();
  const db = databaseHost();
  return (
    <>
      <SiteNav />
      <main className="prose-page">
        <h1>Politique de confidentialité</h1>
        <p>
          Responsable du traitement : l’éditeur du site, joignable à {contactText}. Cette page décrit ce que le code du site fait
          réellement de tes données.
        </p>

        <h2>Sans compte</h2>
        <p>
          Ton profil, ton suivi de candidatures et tes likes restent dans ton navigateur (stockage local) et ne sont pas envoyés à
          Décode. Un cookie technique garde ton âge, ton année et ton type de contrat pour comparer les salaires à ton minimum, un autre
          ton département si tu le choisis. Le site n’utilise ni cookie publicitaire ni outil de mesure d’audience ; les vues et clics des offres sponsorisées sont comptés en total par jour, sans rien qui t’identifie.
        </p>

        <h2>Ce que Décode traite, pourquoi, et combien de temps</h2>
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
            <strong>La mise en avant payante</strong>, pour les entreprises qui s’abonnent : le paiement est traité par Stripe ; Décode ne
            voit jamais le numéro de carte. Les factures sont gardées le temps imposé par la loi.
          </li>
        </ul>
        <p>Supprimer ton compte depuis Mon compte efface aussi ton CV, tes avis, tes salaires déposés, ton profil de la commu et tes messages.</p>

        <h2>Qui reçoit tes données</h2>
        <ul className="bullets">
          <li>Vercel (hébergement du site), États-Unis.</li>
          <li>La base de données{db ? ` : ${db}` : ''}.</li>
          <li>
            Le fournisseur d’IA{ai ? ` (${ai.name})` : ''}, pour le décodeur, l’assistant et, avec Anthropic seulement, la lecture des CV.
            {ai?.freeTier &&
              ' Avec l’offre gratuite de ce fournisseur, le texte envoyé peut servir à améliorer ses modèles : n’y colle jamais tes coordonnées. Ton CV n’est jamais envoyé à une IA gratuite.'}
          </li>
          <li>Resend (envoi des e-mails) et Brevo (envoi des SMS), seulement si tu actives ces alertes.</li>
          <li>Stripe (paiement de la mise en avant), seulement pour les entreprises abonnées.</li>
        </ul>
        <p>
          Tes données ne sont ni vendues ni transmises à des recruteurs : c’est toi qui postules, sur le site de l’offre. Plusieurs de ces
          prestataires sont établis aux États-Unis : les transferts reposent sur les garanties prévues par le RGPD que chacun propose
          (décision d’adéquation UE-États-Unis pour les entreprises certifiées, ou clauses contractuelles types de la Commission
          européenne).
        </p>

        <h2>Tes droits</h2>
        <p>
          Tu peux accéder à tes données, les corriger, les supprimer, t’opposer à un traitement fondé sur l’intérêt légitime, en limiter
          l’usage et en recevoir une copie dans un format lisible par une machine (portabilité). Pour supprimer ton CV ou tout ton compte,
          le bouton est dans Mon compte. Pour tout le reste, écris à {contactText} : réponse sous un mois. Si tu estimes que tes droits ne
          sont pas respectés, tu peux adresser une réclamation à la CNIL (cnil.fr).
        </p>
        <p>Décode ne lit aucune donnée sur LinkedIn et ne contacte personne à ta place.</p>
      </main>
      <SiteFooter />
    </>
  );
}
