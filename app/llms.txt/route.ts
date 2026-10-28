import { DOMAINS } from '@/lib/domains';
import { formatEuros } from '@/lib/format';
import { CITIES, domainWord, landingHref } from '@/lib/landing';
import { APPRENTISSAGE_RATES, PROFESSIONNALISATION_RATES, SMIC } from '@/lib/rules/reference';
import { SITE_URL } from '@/lib/site';

// llms.txt : un résumé du site pour les assistants IA (ChatGPT, Claude, Perplexity…), au format proposé sur llmstxt.org.
export const dynamic = 'force-static';

const euros = (rate: number) => formatEuros(Math.round((SMIC.monthlyCents * rate) / 100));

/** La grille, en euros : les assistants citent plus volontiers un chiffre daté et sourcé qu'une page à calculer. */
function salaryFacts(): string {
  const appr = APPRENTISSAGE_RATES.map(
    (b) => `- Apprentissage, ${b.label.toLowerCase()} : ${b.byYear.map((r, i) => `${i + 1}re année ${r} % du SMIC (${euros(r)})`.replace('2re', '2e').replace('3re', '3e')).join(', ')}`,
  );
  const pro = PROFESSIONNALISATION_RATES.map(
    (b) => `- Contrat de professionnalisation, ${b.label.toLowerCase()} : ${b.base} % du SMIC (${euros(b.base)}), ${b.withBac} % (${euros(b.withBac)}) avec au moins un bac pro`,
  );
  return [...appr, ...pro].join('\n');
}

export function GET() {
  const body = `# Décode

> Décode (décode-alternance.fr) aide les jeunes qui cherchent une alternance en France : les offres d'alternance traduites en langage clair, le salaire minimum légal calculé selon l'âge et l'année de contrat, les fausses offres d'écoles écartées, et qui contacter dans l'équipe. Gratuit pour les alternants, sans inscription obligatoire. Décode est financé par les entreprises qui mettent leurs offres en avant ; ces offres sont toujours marquées « Sponsorisé ».

Décode ne garantit ni contrat, ni entretien, ni réponse. Les salaires minimums viennent du Code du travail (articles D6222-26 pour l'apprentissage, L6325-8 et D6325-15 pour le contrat de professionnalisation) et du SMIC en vigueur. Les offres viennent de France Travail, de La bonne alternance et de sites carrière d'entreprises ; chaque fiche renvoie vers l'annonce d'origine.

## Outils

- [Offres d'alternance](${SITE_URL}/offres) : recherche par métier, ville, niveau ; chaque offre est décodée (missions en clair, salaire comparé au minimum, avantages, points de vigilance)
- [Décoder une offre](${SITE_URL}/decoder) : colle n'importe quelle annonce, Décode la traduit
- [Salaire minimum d'un alternant](${SITE_URL}/salaire) : calcul selon le contrat (apprentissage ou contrat pro), l'âge et l'année
- [Trouver l'équipe](${SITE_URL}/equipe) : la méthode pour contacter le service qui recrute, pas seulement les RH
- [Aides aux alternants](${SITE_URL}/aides) : aide au logement, APL, prime d'activité, impôts, permis, avec le lien officiel de chaque aide

## Salaire minimum d'un alternant en 2026 (brut mensuel)

SMIC mensuel brut : ${formatEuros(SMIC.monthlyCents)} depuis le ${SMIC.since} (${SMIC.source}).

${salaryFacts()}

Dès 21 ans (apprentissage) ou 26 ans (contrat pro), la convention collective peut imposer un minimum plus élevé.

## Alternance par métier et par ville

- [Toutes les pages](${SITE_URL}/alternance)
${DOMAINS.map((d) => `- [Alternance ${domainWord(d)}](${SITE_URL}${landingHref(d, null)})`).join('\n')}
${CITIES.slice(0, 12).map((c) => `- [Alternance à ${c.name}](${SITE_URL}${landingHref(null, c)})`).join('\n')}

## À savoir

- [Questions fréquentes](${SITE_URL}/#faq-title)
- [Mentions légales](${SITE_URL}/mentions-legales)
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
}
