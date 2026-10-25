import { describe, expect, it } from 'vitest';
import { buildTaste, scoreOffer, titleWords, type TasteItem } from './taste';

const item = (o: Partial<TasteItem>): TasteItem => ({
  id: o.id ?? Math.random().toString(),
  title: o.title ?? 'Poste',
  company: o.company ?? null,
  href: '/offres/x',
  department: o.department ?? null,
  romeCode: o.romeCode ?? null,
  companySize: o.companySize ?? null,
  diplomaLevel: o.diplomaLevel ?? null,
  perks: o.perks ?? [],
  at: '2026-10-25',
});

describe('goûts', () => {
  it('garde les mots qui comptent dans un intitulé', () => {
    expect(titleWords('Alternance - Chargé(e) d’études marketing H/F')).toEqual(['etudes', 'marketing']);
  });

  it('classe plus haut ce qui ressemble aux likes et explique pourquoi', () => {
    const t = buildTaste([item({ title: 'Alternance data analyst', department: '75', romeCode: 'M1805' }), item({ title: 'Data scientist alternant', department: '92' })]);
    const data = scoreOffer(item({ title: 'Data engineer en alternance', department: '75', romeCode: 'M1810' }), t);
    const boulanger = scoreOffer(item({ title: 'Apprenti boulanger', department: '35', romeCode: 'D1102' }), t);
    expect(data.score).toBeGreaterThan(boulanger.score);
    expect(data.reason).toBe('Comme « Alternance data analyst » que tu as aimée');
    expect(boulanger.score).toBe(0);
  });

  it('les offres passées font baisser ce qui leur ressemble', () => {
    const t = buildTaste([item({ title: 'Assistant marketing' })], [item({ title: 'Commercial terrain' }), item({ title: 'Commercial sédentaire' })]);
    expect(scoreOffer(item({ title: 'Commercial B2B' }), t).score).toBeLessThan(0);
  });

  it('sans like, aucune note', () => {
    expect(scoreOffer(item({ title: 'Data analyst' }), buildTaste([])).score).toBe(0);
  });
});
