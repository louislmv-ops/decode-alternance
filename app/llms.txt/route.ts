import { SITE_URL } from '@/lib/site';

// llms.txt : un résumé du site pour les assistants IA (ChatGPT, Claude, Perplexity…), au format proposé sur llmstxt.org.
export const dynamic = 'force-static';

export function GET() {
  const body = `# Décode

> Décode (décode-alternance.fr) aide les jeunes qui cherchent une alternance en France : les offres d'alternance traduites en langage clair, le salaire minimum légal calculé selon l'âge et l'année de contrat, les fausses offres d'écoles écartées, et qui contacter dans l'équipe. Gratuit, sans inscription obligatoire.

Décode ne garantit ni contrat, ni entretien, ni réponse. Les salaires minimums viennent du Code du travail (articles D6222-26 pour l'apprentissage, L6325-8 et D6325-15 pour le contrat de professionnalisation) et du SMIC en vigueur. Les offres viennent de France Travail, de La bonne alternance et de sites carrière d'entreprises ; chaque fiche renvoie vers l'annonce d'origine.

## Outils

- [Offres d'alternance](${SITE_URL}/offres) : recherche par métier, ville, niveau ; chaque offre est décodée (missions en clair, salaire comparé au minimum, avantages, pièges)
- [Décoder une offre](${SITE_URL}/decoder) : colle n'importe quelle annonce, Décode la traduit
- [Salaire minimum d'un alternant](${SITE_URL}/salaire) : calcul selon le contrat (apprentissage ou contrat pro), l'âge et l'année
- [Trouver l'équipe](${SITE_URL}/equipe) : la méthode pour contacter le service qui recrute, pas seulement les RH
- [Aides aux alternants](${SITE_URL}/aides) : aide au logement, APL, prime d'activité, impôts, permis, avec le lien officiel de chaque aide

## À savoir

- [Questions fréquentes](${SITE_URL}/#faq-title)
- [Mentions légales](${SITE_URL}/mentions-legales)
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
}
