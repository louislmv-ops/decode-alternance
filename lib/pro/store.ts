import { ensureSchema as ensureAccounts } from '@/lib/account/store';
import { db } from '@/lib/offers/store';
import { isProActive, type ProState, TRIAL_DAYS } from './plan';

let ready: Promise<void> | null = null;

function ensureSchema(): Promise<void> {
  ready ??= (async () => {
    await ensureAccounts();
    await db()`alter table accounts
      add column if not exists trial_until timestamptz,
      add column if not exists pro_until timestamptz,
      add column if not exists pro_status text,
      add column if not exists pro_cancel_at_period_end boolean not null default false,
      add column if not exists stripe_customer_id text,
      add column if not exists stripe_subscription_id text`;
  })().catch((error) => {
    ready = null;
    throw error;
  });
  return ready;
}

interface Row {
  trial_until: Date | null;
  pro_until: Date | null;
  pro_status: string | null;
  pro_cancel_at_period_end: boolean;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
}

async function row(accountId: string): Promise<Row | null> {
  await ensureSchema();
  const [r] = await db()<Row[]>`select trial_until, pro_until, pro_status, pro_cancel_at_period_end, stripe_customer_id, stripe_subscription_id
    from accounts where id = ${accountId}`;
  return r ?? null;
}

export async function proState(accountId: string): Promise<ProState> {
  const r = await row(accountId);
  return {
    pro: r ? isProActive(r.trial_until, r.pro_until, r.pro_status) : false,
    trialUntil: r?.trial_until?.toISOString() ?? null,
    trialUsed: Boolean(r?.trial_until),
    status: r?.pro_status ?? null,
    periodEnd: r?.pro_until?.toISOString() ?? null,
    cancelAtPeriodEnd: r?.pro_cancel_at_period_end ?? false,
  };
}

export async function isPro(accountId: string): Promise<boolean> {
  return (await proState(accountId)).pro;
}

/** Un seul essai par compte, et pas pendant un abonnement. */
export async function startTrial(accountId: string): Promise<boolean> {
  await ensureSchema();
  const rows = await db()`update accounts set trial_until = now() + ${`${TRIAL_DAYS} days`}::interval
    where id = ${accountId} and trial_until is null and stripe_subscription_id is null returning id`;
  return rows.length > 0;
}

export async function stripeIds(accountId: string): Promise<{ customer: string | null; subscription: string | null }> {
  const r = await row(accountId);
  return { customer: r?.stripe_customer_id ?? null, subscription: r?.stripe_subscription_id ?? null };
}

export async function setCustomer(accountId: string, customerId: string): Promise<void> {
  await ensureSchema();
  await db()`update accounts set stripe_customer_id = ${customerId} where id = ${accountId}`;
}

/** Recopie l'état d'un abonnement Stripe sur le compte, retrouvé par son id ou par le client Stripe. */
export async function applySubscription(sub: {
  accountId?: string;
  customerId: string;
  subscriptionId: string;
  status: string;
  periodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}): Promise<string | null> {
  await ensureSchema();
  const [r] = await db()<{ id: string }[]>`update accounts set
      stripe_customer_id = ${sub.customerId}, stripe_subscription_id = ${sub.subscriptionId}, pro_status = ${sub.status},
      pro_until = ${sub.periodEnd}, pro_cancel_at_period_end = ${sub.cancelAtPeriodEnd}
    where ${sub.accountId ? db()`id = ${sub.accountId}` : db()`stripe_customer_id = ${sub.customerId}`}
    returning id`;
  return r?.id ?? null;
}

/** Les comptes Pro à prévenir dans l'heure. */
export async function proAccountIds(): Promise<Set<string>> {
  await ensureSchema();
  const rows = await db()<{ id: string }[]>`select id from accounts
    where trial_until > now() or (pro_until > now() and pro_status in ('active', 'trialing', 'past_due'))`;
  return new Set(rows.map((r) => r.id));
}

/** S'il reste plus de 2 jours d'essai, l'abonnement payant commence à sa fin (Stripe exige au moins 48 h). */
export async function trialEndForCheckout(accountId: string): Promise<number | null> {
  const { trialUntil } = await proState(accountId);
  if (!trialUntil) return null;
  const end = Math.floor(new Date(trialUntil).getTime() / 1000);
  return end - Date.now() / 1000 > 2 * 86_400 ? end : null;
}
