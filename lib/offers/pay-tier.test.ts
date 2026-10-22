import { describe, expect, it } from 'vitest';
import { payTier } from './pay-tier';

describe('payTier', () => {
  it('note la paie par rapport au minimum légal', () => {
    expect(payTier(100_000, 100_000)).toBe(1);
    expect(payTier(110_000, 100_000)).toBe(1);
    expect(payTier(120_000, 100_000)).toBe(2);
    expect(payTier(130_000, 100_000)).toBe(2);
    expect(payTier(148_000, 100_000)).toBe(3);
  });

  it('ne note pas une offre sans montant', () => {
    expect(payTier(null, 100_000)).toBeNull();
  });
});
