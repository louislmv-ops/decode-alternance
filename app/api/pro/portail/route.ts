import { currentAccount, notConfigured } from '@/lib/account/http';
import { isAccountsConfigured } from '@/lib/account/store';
import { sponsorState } from '@/lib/sponsors/store';
import { isStripeConfigured, stripe } from '@/lib/sponsors/stripe';
import { SITE_URL } from '@/lib/site';

/** Le portail Stripe : carte bancaire, factures et résiliation. */
export async function POST() {
  if (!isAccountsConfigured() || !isStripeConfigured()) return notConfigured();
  const account = await currentAccount();
  if (!account) return Response.json({ error: 'Connecte-toi d’abord.' }, { status: 401 });
  const { customerId } = await sponsorState(account.id);
  if (!customerId) return Response.json({ error: 'Aucun abonnement.' }, { status: 404 });
  const session = await stripe<{ url: string }>('billing_portal/sessions', { customer: customerId, return_url: `${SITE_URL}/pro/tableau`, locale: 'fr' });
  return Response.json({ url: session.url });
}
