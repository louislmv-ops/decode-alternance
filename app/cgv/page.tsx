import type { Metadata } from 'next';
import { SiteFooter } from '@/components/site/SiteFooter';
import { SiteNav } from '@/components/site/SiteNav';

export const metadata: Metadata = { title: 'Conditions de vente de la mise en avant', alternates: { canonical: '/cgv' } };

const LEGAL = {
  editor: process.env.LEGAL_EDITOR || '[NOM OU RAISON SOCIALE]',
  address: process.env.LEGAL_ADDRESS || '[ADRESSE]',
  siren: process.env.LEGAL_SIREN || '[NUMÉRO SIREN]',
  contact: process.env.LEGAL_CONTACT || process.env.NEXT_PUBLIC_CONTACT_EMAIL || '[ADRESSE E-MAIL]',
};

export default function SalesTermsPage() {
  return (
    <>
      <SiteNav />
      <main className="prose-page">
        <h1>Conditions de vente de la mise en avant</h1>
        <p>
          Vendeur : {LEGAL.editor}, {LEGAL.address}, SIREN {LEGAL.siren}. Contact : {LEGAL.contact}.
        </p>
        <p>
          Décode est gratuit pour les alternants : rien ne leur est vendu. Seules les entreprises peuvent acheter la mise en avant, dans le
          cadre de leur activité professionnelle. Ces conditions s’appliquent entre professionnels.
        </p>

        <h2>Ce que l’entreprise achète</h2>
        <p>
          Un abonnement mensuel qui place au plus deux offres de l’entreprise en haut de la première page des recherches auxquelles elles
          correspondent, sur Décode. Ces offres portent toujours la mention « Sponsorisé ». L’abonnement donne aussi accès aux vues et
          clics de ces offres et aux profils des alternants qui ont aimé une offre de l’entreprise et ont accepté qu’elle les voie.
        </p>
        <p>
          La mise en avant est réservée aux entreprises inscrites et vérifiées (SIRET et e-mail professionnel). Les offres viennent des
          sources habituelles de Décode : une offre qui n’y figure pas ne peut pas être mise en avant. Décode ne garantit ni nombre de vues,
          ni candidatures, ni recrutement.
        </p>

        <h2>Prix et paiement</h2>
        <p>
          Le prix est celui affiché sur la page entreprises au moment de l’abonnement, hors taxes et TVA en sus si elle s’applique. Le
          paiement se fait par carte via Stripe, au début de chaque mois d’abonnement. Une facture est disponible dans le portail de
          facturation. Décode ne voit ni ne garde le numéro de carte.
        </p>

        <h2>Durée et résiliation</h2>
        <p>
          L’abonnement se renouvelle chaque mois. L’entreprise peut le résilier à tout moment depuis son tableau de bord, « Factures et
          résiliation ». La mise en avant continue jusqu’à la fin du mois payé, puis s’arrête, sans autre prélèvement. Un mois commencé
          n’est pas remboursé.
        </p>

        <h2>Règles et suspension</h2>
        <p>
          Les messages envoyés aux alternants respectent la charte de Décode : pas de démarchage pour une école ou une formation payante,
          pas de collecte de données hors de l’échange. Décode peut suspendre la mise en avant d’une entreprise qui ne respecte pas ces
          règles ou la loi, après l’en avoir informée ; le mois en cours est alors remboursé au prorata, sauf manquement grave.
        </p>

        <h2>Données</h2>
        <p>
          Les vues et clics sont comptés sans rien enregistrer sur les personnes. Les profils d’alternants consultés ne doivent servir qu’à
          leur proposer une alternance, et ne peuvent être ni copiés ni revendus.
        </p>

        <h2>Litiges</h2>
        <p>Écris d’abord à {LEGAL.contact}. Le droit français s’applique ; à défaut d’accord, les tribunaux compétents sont ceux du siège du vendeur.</p>
      </main>
      <SiteFooter />
    </>
  );
}
