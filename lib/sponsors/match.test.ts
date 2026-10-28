import { describe, expect, it } from 'vitest';
import { injectSponsored, sponsorOf } from './match';

const sponsors = [{ accountId: 'a', company: 'Groupe Alpha SAS', siren: '123456789' }];

describe('mise en avant', () => {
  it('reconnaît l’entreprise par son SIREN ou par son nom exact', () => {
    expect(sponsorOf({ company: 'Autre nom', companySiren: '123456789' }, sponsors)?.accountId).toBe('a');
    expect(sponsorOf({ company: 'ALPHA' }, sponsors)?.accountId).toBe('a');
    expect(sponsorOf({ company: 'Alpha' }, sponsors)?.accountId).toBe('a');
  });

  it('ne prend pas une entreprise au nom proche', () => {
    expect(sponsorOf({ company: 'Alphabet' }, sponsors)).toBeNull();
    expect(sponsorOf({ company: null }, sponsors)).toBeNull();
  });

  it('place deux offres au plus, aux places 1 et 6, sans doublon', () => {
    const page = Array.from({ length: 8 }, (_, i) => ({ id: `o${i}` }));
    const out = injectSponsored(page, [{ id: 's1' }, { id: 'o7' }, { id: 's3' }]);
    expect(out.map((o) => o.id)).toEqual(['s1', 'o0', 'o1', 'o2', 'o3', 'o7', 'o4', 'o5', 'o6']);
    expect(out.filter((o) => o.sponsored).map((o) => o.id)).toEqual(['s1', 'o7']);
  });

  it('ne change rien sans offre sponsorisée, et s’adapte à une page courte', () => {
    const page = [{ id: 'o0' }, { id: 'o1' }];
    expect(injectSponsored(page, [])).toBe(page);
    expect(injectSponsored(page, [{ id: 's1' }, { id: 's2' }]).map((o) => o.id)).toEqual(['s1', 'o0', 'o1', 's2']);
  });
});
