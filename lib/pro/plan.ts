// Décode Pro : la version gratuite reste complète (offres, décodage, avis et salaires, commu, suivi).
// Pro ajoute ce qui nous coûte à chaque usage : les SMS, les alertes toutes les heures, l'IA d'entretien.

export const TRIAL_DAYS = 30;

export const PRO_FEATURES = [
  ['Alertes toutes les heures', 'Les nouvelles offres de ta recherche toutes les heures en journée, au lieu d’une fois le matin.'],
  ['Alertes par SMS', 'En plus de l’e-mail, sur ton téléphone.'],
  ['Prépa entretien', 'Pour chaque offre : les questions probables, quoi répondre, et quoi demander.'],
] as const;

export interface ProState {
  pro: boolean;
  /** Fin de l'essai gratuit, s'il est en cours ou passé. */
  trialUntil: string | null;
  trialUsed: boolean;
  /** Abonnement payant : statut Stripe et fin de la période en cours. */
  status: string | null;
  periodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

export function isProActive(trialUntil: Date | null, proUntil: Date | null, status: string | null, now = new Date()): boolean {
  if (trialUntil && trialUntil > now) return true;
  // Un paiement en retard laisse quelques jours à Stripe pour réessayer : on garde l'accès jusqu'à la fin de la période.
  return Boolean(proUntil && proUntil > now && status && ['active', 'trialing', 'past_due'].includes(status));
}

/** « 299, eur, month » devient « 2,99 € / mois ». */
export function priceLabel(cents: number, currency: string, interval: string): string {
  const amount = (cents / 100).toLocaleString('fr-FR', { style: 'currency', currency: currency.toUpperCase(), minimumFractionDigits: cents % 100 ? 2 : 0 });
  return `${amount} / ${interval === 'year' ? 'an' : 'mois'}`;
}
