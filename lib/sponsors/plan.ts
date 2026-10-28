// La mise en avant, l'offre payante de Décode, réservée aux entreprises. Pour les alternants, tout est gratuit.
// Le prix vient toujours de Stripe : celui affiché est celui facturé, jamais un montant écrit dans le code.

export const SPONSOR_FEATURES = [
  ['Tes offres en tête', 'Jusqu’à deux de tes offres en haut de la première page des recherches qui leur correspondent, sur la liste, les pages par ville et le swipe.'],
  ['Toujours « Sponsorisé »', 'Les alternants voient que c’est une mise en avant : la confiance reste intacte, la tienne aussi.'],
  ['Les alternants intéressés', 'Ceux qui ont aimé une de tes offres et ont accepté que tu voies leur profil. Tu leur écris directement.'],
  ['Vues et clics', 'Chaque jour, combien de fois tes offres mises en avant ont été vues et ouvertes.'],
] as const;

/** Inclus pour toutes les entreprises vérifiées, abonnées ou non. */
export const FREE_FOR_COMPANIES = ['Chercher des alternants qui ont accepté d’être vus', '20 messages par jour', 'Les campagnes de recrutement'];

/** « 4900, eur, month » devient « 49 € / mois ». */
export function priceLabel(cents: number, currency: string, interval: string): string {
  const amount = (cents / 100).toLocaleString('fr-FR', { style: 'currency', currency: currency.toUpperCase(), minimumFractionDigits: cents % 100 ? 2 : 0 });
  return `${amount} / ${interval === 'year' ? 'an' : 'mois'}`;
}

/** Un paiement en retard laisse quelques jours à Stripe pour réessayer : la mise en avant continue jusqu'à la fin de la période. */
export const ACTIVE_STATUSES = ['active', 'trialing', 'past_due'];

export function isSponsorActive(status: string | null, periodEnd: Date | null, now = new Date()): boolean {
  return Boolean(status && ACTIVE_STATUSES.includes(status) && periodEnd && periodEnd > now);
}
