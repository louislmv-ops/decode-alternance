import { describe, expect, it } from 'vitest';
import { matchOffer } from './match';

const profile = { job: 'marketing', department: '75', level: 6 as const, filled: true };

describe('matchOffer', () => {
  it('dit ce qui colle', () => {
    expect(matchOffer({ title: 'Chargé(e) de marketing digital', department: '75', diplomaLevel: 6 }, profile)).toEqual({
      fits: ['Ton domaine', 'Dans ton département', 'Ton niveau'],
      misses: [],
    });
  });

  it('dit ce qui te manque', () => {
    expect(matchOffer({ title: 'Technicien de maintenance', department: '31', diplomaLevel: 7 }, profile)).toEqual({
      fits: [],
      misses: ['Pas ton domaine', 'Hors de ton département', 'Demande Bac+5, tu vises Bac+3'],
    });
  });

  it('reconnaît un domaine par ses mots', () => {
    expect(matchOffer({ title: 'Assistant SEO et acquisition', department: null, diplomaLevel: null }, profile)?.fits).toEqual(['Ton domaine']);
  });

  it('ne confond pas un bout de mot avec le domaine', () => {
    expect(matchOffer({ title: 'Chargé de communication et réseaux sociaux', department: null, diplomaLevel: null }, profile)?.misses).toEqual(['Pas ton domaine']);
  });

  it('ne dit rien sans profil', () => {
    expect(matchOffer({ title: 'Marketing', department: '75', diplomaLevel: 6 }, { ...profile, filled: false })).toBeNull();
  });
});
