import { createHmac } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { isProActive, priceLabel } from './plan';

vi.mock('server-only', () => ({}));
const { periodEnd, toForm, verifyWebhook } = await import('./stripe');

const now = new Date('2027-01-15T12:00:00Z');
const later = new Date('2027-02-01T00:00:00Z');
const before = new Date('2027-01-01T00:00:00Z');

describe('accès Pro', () => {
  it('pendant l’essai', () => {
    expect(isProActive(later, null, null, now)).toBe(true);
    expect(isProActive(before, null, null, now)).toBe(false);
  });

  it('pendant un abonnement actif ou en retard de paiement, jusqu’à la fin de la période', () => {
    expect(isProActive(null, later, 'active', now)).toBe(true);
    expect(isProActive(null, later, 'past_due', now)).toBe(true);
    expect(isProActive(null, later, 'canceled', now)).toBe(false);
    expect(isProActive(null, before, 'active', now)).toBe(false);
  });
});

describe('prix', () => {
  it('s’affiche en euros', () => {
    expect(priceLabel(299, 'eur', 'month').replace(/\s/g, ' ')).toBe('2,99 € / mois');
    expect(priceLabel(2000, 'eur', 'year').replace(/\s/g, ' ')).toBe('20 € / an');
  });
});

describe('Stripe', () => {
  it('aplatit les paramètres', () => {
    expect(toForm({ mode: 'subscription', line_items: [{ price: 'p_1', quantity: 1 }] })).toEqual([
      'mode=subscription',
      'line_items%5B0%5D%5Bprice%5D=p_1',
      'line_items%5B0%5D%5Bquantity%5D=1',
    ]);
  });

  it('vérifie la signature des webhooks', () => {
    const body = '{"id":"evt_1"}';
    const t = Math.floor(now.getTime() / 1000);
    const sig = createHmac('sha256', 'whsec_test').update(`${t}.${body}`).digest('hex');
    expect(verifyWebhook(body, `t=${t},v1=${sig}`, 'whsec_test', now.getTime())).toBe(true);
    expect(verifyWebhook(body + ' ', `t=${t},v1=${sig}`, 'whsec_test', now.getTime())).toBe(false);
    expect(verifyWebhook(body, `t=${t},v1=${sig}`, 'whsec_test', now.getTime() + 600_000)).toBe(false);
    expect(verifyWebhook(body, null, 'whsec_test', now.getTime())).toBe(false);
  });

  it('lit la fin de période ancienne ou nouvelle formule', () => {
    expect(periodEnd({ id: 's', customer: 'c', status: 'active', cancel_at_period_end: false, current_period_end: 1_800_000_000 })?.getTime()).toBe(1_800_000_000_000);
    expect(periodEnd({ id: 's', customer: 'c', status: 'active', cancel_at_period_end: false, items: { data: [{ current_period_end: 1_800_000_000 }] } })?.getTime()).toBe(1_800_000_000_000);
  });
});
