import 'server-only';
// Stripe sans SDK : quatre appels REST et la vérification de signature des webhooks.
// STRIPE_PRICE_ID est le prix mensuel de la mise en avant des entreprises.

import { createHmac, timingSafeEqual } from 'node:crypto';

const api = () => process.env.STRIPE_API_URL || 'https://api.stripe.com';

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID && process.env.STRIPE_WEBHOOK_SECRET);
}

/** Aplati un objet au format de formulaire de Stripe : line_items[0][price]=… */
export function toForm(params: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(params).flatMap(([k, v]) => {
    const key = prefix ? `${prefix}[${k}]` : k;
    if (v === undefined || v === null) return [];
    if (typeof v === 'object') return toForm(v as Record<string, unknown>, key);
    return [`${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`];
  });
}

export async function stripe<T>(path: string, params?: Record<string, unknown>, method: 'GET' | 'POST' = params ? 'POST' : 'GET'): Promise<T> {
  const res = await fetch(`${api()}/v1/${path}`, {
    method,
    headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params ? toForm(params).join('&') : undefined,
    signal: AbortSignal.timeout(10_000),
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: { message?: string } };
  if (!res.ok) throw new Error(`Stripe ${res.status} : ${data.error?.message ?? 'erreur'}`);
  return data;
}

let priceCache: { at: number; value: { cents: number; currency: string; interval: string } } | null = null;

/** Le prix vient de Stripe : celui affiché est toujours celui facturé. */
export async function currentPrice(): Promise<{ cents: number; currency: string; interval: string } | null> {
  if (!isStripeConfigured()) return null;
  if (priceCache && Date.now() - priceCache.at < 3_600_000) return priceCache.value;
  const p = await stripe<{ unit_amount: number; currency: string; recurring?: { interval: string } }>(`prices/${process.env.STRIPE_PRICE_ID}`);
  priceCache = { at: Date.now(), value: { cents: p.unit_amount, currency: p.currency, interval: p.recurring?.interval ?? 'month' } };
  return priceCache.value;
}

/** Vérifie l'en-tête Stripe-Signature (t=…,v1=…) : HMAC-SHA256 de « t.corps », 5 minutes de tolérance. */
export function verifyWebhook(payload: string, header: string | null, secret: string, now = Date.now()): boolean {
  if (!header) return false;
  const parts = Object.fromEntries(header.split(',').map((p) => p.split('=') as [string, string]));
  const t = Number(parts.t);
  if (!t || Math.abs(now / 1000 - t) > 300) return false;
  const expected = createHmac('sha256', secret).update(`${t}.${payload}`).digest('hex');
  const given = header
    .split(',')
    .filter((p) => p.startsWith('v1='))
    .map((p) => p.slice(3));
  return given.some((g) => g.length === expected.length && timingSafeEqual(Buffer.from(g), Buffer.from(expected)));
}

export interface StripeSubscription {
  id: string;
  customer: string;
  status: string;
  cancel_at_period_end: boolean;
  /** Avant l'API 2025-03-31 ; ensuite, la date est portée par chaque élément. */
  current_period_end?: number;
  items?: { data?: { current_period_end?: number }[] };
  metadata?: Record<string, string>;
}

export function periodEnd(sub: StripeSubscription): Date | null {
  const s = sub.current_period_end ?? sub.items?.data?.[0]?.current_period_end;
  return s ? new Date(s * 1000) : null;
}
