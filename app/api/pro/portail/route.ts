import { currentAccount, notConfigured } from '@/lib/account/http';
import { isAccountsConfigured } from '@/lib/account/store';
import { stripeIds } from '@/lib/pro/store';
import { isStripeConfigured, stripe } from '@/lib/pro/stripe';
import { SITE_URL } from '@/lib/site';

/** Le portail Stripe : carte bancaire et factures. */
export async function POST() {
  if (!isAccountsConfigured() || !isStripeConfigured()) return notConfigured();
  const account = await currentAccount();
  if (!account) return Response.json({ error: 'Connecte-toi d’abord.' }, { status: 401 });
  const { customer } = await stripeIds(account.id);
  if (!customer) return Response.json({ error: 'Aucun abonnement.' }, { status: 404 });
  const session = await stripe<{ url: string }>('billing_portal/sessions', { customer, return_url: `${SITE_URL}/pro`, locale: 'fr' });
  return Response.json({ url: session.url });
}
