import { currentAccount, notConfigured } from '@/lib/account/http';
import { isAccountsConfigured } from '@/lib/account/store';
import { recruiterByAccount } from '@/lib/recruiters/store';
import { setSponsorCustomer, sponsorState } from '@/lib/sponsors/store';
import { isStripeConfigured, stripe } from '@/lib/sponsors/stripe';
import { SITE_URL } from '@/lib/site';

/**
 * Ouvre le paiement Stripe de la mise en avant. Seulement pour une entreprise vérifiée : on ne fait pas payer une
 * entreprise que l'on pourrait refuser ensuite.
 */
export async function POST() {
  if (!isAccountsConfigured() || !isStripeConfigured()) return notConfigured();
  const account = await currentAccount();
  if (!account) return Response.json({ error: 'Connecte-toi d’abord.' }, { status: 401 });
  const recruiter = await recruiterByAccount(account.id);
  if (!recruiter) return Response.json({ error: 'Inscris d’abord ton entreprise dans l’espace entreprise.' }, { status: 403 });
  if (!recruiter.verified) return Response.json({ error: 'Ton entreprise est en cours de vérification. Tu pourras t’abonner juste après.' }, { status: 403 });
  const state = await sponsorState(account.id);
  if (state.active) return Response.json({ error: 'La mise en avant est déjà active.' }, { status: 409 });
  let customer = state.customerId;
  if (!customer) {
    customer = (
      await stripe<{ id: string }>('customers', {
        email: account.email,
        name: recruiter.company,
        metadata: { account_id: account.id, siret: recruiter.siret },
      })
    ).id;
    await setSponsorCustomer(account.id, customer);
  }
  const session = await stripe<{ url: string }>('checkout/sessions', {
    mode: 'subscription',
    customer,
    client_reference_id: account.id,
    line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
    subscription_data: { metadata: { account_id: account.id, kind: 'sponsor' } },
    // Une entreprise a souvent besoin de son numéro de TVA sur la facture.
    tax_id_collection: { enabled: true },
    customer_update: { name: 'auto', address: 'auto' },
    allow_promotion_codes: true,
    locale: 'fr',
    success_url: `${SITE_URL}/pro/tableau?ok=1`,
    cancel_url: `${SITE_URL}/pro`,
  });
  return Response.json({ url: session.url });
}
