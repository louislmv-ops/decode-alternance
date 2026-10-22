import type { Metadata } from 'next';
import { SiteFooter } from '@/components/site/SiteFooter';
import { SiteNav } from '@/components/site/SiteNav';
import { TRIAL_DAYS } from '@/lib/pro/plan';

export const metadata: Metadata = { title: 'Conditions de vente de Décode Pro' };

const LEGAL = {
  editor: process.env.LEGAL_EDITOR || '[NOM OU RAISON SOCIALE]',
  address: process.env.LEGAL_ADDRESS || '[ADRESSE]',
  siren: process.env.LEGAL_SIREN || '[NUMÉRO SIREN]',
  contact: process.env.LEGAL_CONTACT || process.env.NEXT_PUBLIC_CONTACT_EMAIL || '[ADRESSE E-MAIL]',
  mediator: process.env.LEGAL_MEDIATOR || '[MÉDIATEUR DE LA CONSOMMATION À DÉSIGNER]',
};

export default function SalesTermsPage() {
  return (
    <>
      <SiteNav />
      <main className="prose-page">
        <h1>Conditions de vente de Décode Pro</h1>
        <p>
          Vendeur : {LEGAL.editor}, {LEGAL.address}, SIREN {LEGAL.siren}. Contact : {LEGAL.contact}.
        </p>

        <h2>Ce que tu achètes</h2>
        <p>
          Décode Pro est un abonnement qui ajoute à Décode : les alertes de nouvelles offres toutes les heures en journée, les alertes par
          SMS et la préparation d’entretien générée par une IA. Tout le reste du site reste gratuit. Décode Pro ne garantit ni contrat, ni
          entretien, ni réponse d’un employeur. La prépa entretien est générée automatiquement à partir de l’annonce : elle peut contenir
          des erreurs.
        </p>

        <h2>Essai gratuit</h2>
        <p>
          Chaque compte peut essayer Pro {TRIAL_DAYS} jours, sans carte bancaire. À la fin de l’essai, Pro s’arrête tout seul : rien n’est
          prélevé si tu ne t’abonnes pas. Si tu t’abonnes pendant l’essai, le premier paiement a lieu à sa fin.
        </p>

        <h2>Prix et paiement</h2>
        <p>
          Le prix est celui affiché sur la page Pro au moment de l’abonnement, toutes taxes comprises. Le paiement se fait par carte via
          Stripe, au début de chaque période. Décode ne voit ni ne garde ton numéro de carte.
        </p>

        <h2>Durée et résiliation</h2>
        <p>
          L’abonnement se renouvelle automatiquement chaque période. Tu peux le résilier à tout moment depuis la page Pro, bouton « Résilier
          », en un clic. Tu reçois une confirmation par e-mail. Pro reste actif jusqu’à la fin de la période payée, puis rien n’est plus
          prélevé.
        </p>

        <h2>Rétractation</h2>
        <p>
          Tu as 14 jours après ton abonnement pour te rétracter, sans justification, en écrivant à {LEGAL.contact}. Si tu as demandé à
          utiliser Pro tout de suite, le montant correspondant aux jours déjà utilisés peut être retenu ; le reste est remboursé sous 14
          jours (articles L221-18 et L221-25 du Code de la consommation).
        </p>

        <h2>Litiges</h2>
        <p>
          Écris d’abord à {LEGAL.contact}. Sans solution, tu peux saisir gratuitement le médiateur de la consommation : {LEGAL.mediator}. Le
          droit français s’applique.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
