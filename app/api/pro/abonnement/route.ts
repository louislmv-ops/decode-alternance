import { currentAccount, notConfigured } from '@/lib/account/http';
import { isAccountsConfigured } from '@/lib/account/store';
import { SITE_URL } from '@/lib/site';
import { isPro, setCustomer, stripeIds, trialEndForCheckout } from '@/lib/pro/store';
import { isStripeConfigured, stripe } from '@/lib/pro/stripe';

/** Ouvre le paiement Stripe. Pendant l'essai, l'abonnement ne démarre qu'à la fin du mois offert. */
export async function POST() {
  if (!isAccountsConfigured() || !isStripeConfigured()) return notConfigured();
  const account = await currentAccount();
  if (!account) return Response.json({ error: 'Connecte-toi d’abord.' }, { status: 401 });
  const ids = await stripeIds(account.id);
  if (ids.subscription && (await isPro(account.id))) return Response.json({ error: 'Tu es déjà abonné.' }, { status: 409 });
  let customer = ids.customer;
  if (!customer) {
    customer = (await stripe<{ id: string }>('customers', { email: account.email, metadata: { account_id: account.id } })).id;
    await setCustomer(account.id, customer);
  }
  const trialEnd = await trialEndForCheckout(account.id);
  const session = await stripe<{ url: string }>('checkout/sessions', {
    mode: 'subscription',
    customer,
    client_reference_id: account.id,
    line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
    subscription_data: { metadata: { account_id: account.id }, ...(trialEnd ? { trial_end: trialEnd } : {}) },
    allow_promotion_codes: true,
    locale: 'fr',
    success_url: `${SITE_URL}/pro?ok=1`,
    cancel_url: `${SITE_URL}/pro`,
  });
  return Response.json({ url: session.url });
}
