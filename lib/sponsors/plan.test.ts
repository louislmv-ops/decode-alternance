import { createHmac } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { isSponsorActive, priceLabel } from './plan';

vi.mock('server-only', () => ({}));
const { periodEnd, toForm, verifyWebhook } = await import('./stripe');

const now = new Date('2027-01-15T12:00:00Z');
const later = new Date('2027-02-01T00:00:00Z');
const before = new Date('2027-01-01T00:00:00Z');

describe('mise en avant active', () => {
  it('pendant un abonnement actif ou en retard de paiement, jusqu’à la fin de la période', () => {
    expect(isSponsorActive('active', later, now)).toBe(true);
    expect(isSponsorActive('past_due', later, now)).toBe(true);
    expect(isSponsorActive('canceled', later, now)).toBe(false);
    expect(isSponsorActive('active', before, now)).toBe(false);
    expect(isSponsorActive(null, null, now)).toBe(false);
  });
});

describe('prix', () => {
  it('s’affiche en euros', () => {
    expect(priceLabel(4900, 'eur', 'month').replace(/\s/g, ' ')).toBe('49 € / mois');
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
