import { applySponsorSubscription } from '@/lib/sponsors/store';
import { periodEnd, stripe, type StripeSubscription, verifyWebhook } from '@/lib/sponsors/stripe';

interface StripeEvent {
  type: string;
  data: { object: Record<string, unknown> };
}

/** Stripe prévient ici à chaque changement d'abonnement : on recopie son état sur l'entreprise. */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const payload = await request.text();
  if (!secret || !verifyWebhook(payload, request.headers.get('stripe-signature'), secret)) {
    return Response.json({ error: 'Signature invalide.' }, { status: 400 });
  }
  const event = JSON.parse(payload) as StripeEvent;
  const object = event.data.object;

  let sub: StripeSubscription | null = null;
  let accountId: string | undefined;
  if (event.type === 'checkout.session.completed' && typeof object.subscription === 'string') {
    sub = await stripe<StripeSubscription>(`subscriptions/${object.subscription}`);
    accountId = typeof object.client_reference_id === 'string' ? object.client_reference_id : undefined;
  } else if (event.type.startsWith('customer.subscription.')) {
    sub = object as unknown as StripeSubscription;
    accountId = sub.metadata?.account_id;
  }
  if (sub) {
    await applySponsorSubscription({
      accountId,
      customerId: sub.customer,
      subscriptionId: sub.id,
      status: event.type === 'customer.subscription.deleted' ? 'canceled' : sub.status,
      periodEnd: periodEnd(sub),
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    });
  }
  return Response.json({ received: true });
}
