import { currentAccount, notConfigured } from '@/lib/account/http';
import { sendEmail } from '@/lib/account/senders';
import { isAccountsConfigured } from '@/lib/account/store';
import { applySubscription, stripeIds } from '@/lib/pro/store';
import { isStripeConfigured, periodEnd, stripe, type StripeSubscription } from '@/lib/pro/stripe';

/**
 * Résilier en un clic, sans passer par Stripe (obligation de la loi du 16 août 2022).
 * Pro reste actif jusqu'à la fin de la période payée ; rien n'est plus prélevé ensuite.
 */
export async function POST() {
  if (!isAccountsConfigured() || !isStripeConfigured()) return notConfigured();
  const account = await currentAccount();
  if (!account) return Response.json({ error: 'Connecte-toi d’abord.' }, { status: 401 });
  const { subscription } = await stripeIds(account.id);
  if (!subscription) return Response.json({ error: 'Aucun abonnement à résilier.' }, { status: 404 });
  const sub = await stripe<StripeSubscription>(`subscriptions/${subscription}`, { cancel_at_period_end: true });
  const end = periodEnd(sub);
  await applySubscription({ accountId: account.id, customerId: sub.customer, subscriptionId: sub.id, status: sub.status, periodEnd: end, cancelAtPeriodEnd: true });
  const day = end?.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Paris' });
  await sendEmail(
    account.email,
    'Ton abonnement Décode Pro est résilié',
    `C'est fait : ton abonnement Décode Pro est résilié.\n\n${day ? `Tu gardes Pro jusqu'au ${day}. ` : ''}Aucun autre prélèvement ne sera fait.\n\nLa version gratuite reste à toi : offres, décodage, avis et salaires, commu, suivi.`,
  ).catch(() => {});
  return Response.json({ ok: true, periodEnd: end?.toISOString() ?? null });
}
