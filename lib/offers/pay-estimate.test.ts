import { describe, expect, it } from 'vitest';
import { payDisplay } from './pay-display';
import { mentionsLegalGrid, payEstimate, summarizePercents } from './pay-estimate';

describe('payEstimate', () => {
  const community = { siren: '123456789', count: 4, medianPercent: 10, lowPercent: 5, highPercent: 20 };

  it('garde le montant de l’annonce avant tout', () => {
    expect(payEstimate(150_000, 100_000, community)).toMatchObject({ source: 'annonce', cents: 150_000, lowCents: null });
  });

  it('ramène les déclarations des alternants au minimum de la personne, avec une fourchette', () => {
    expect(payEstimate(null, 100_000, community)).toEqual({ source: 'alternants', cents: 110_000, lowCents: 105_000, highCents: 120_000, count: 4, legalGrid: false });
  });

  it('ne descend jamais sous le minimum légal', () => {
    const below = { ...community, medianPercent: -10, lowPercent: -20, highPercent: -5 };
    expect(payEstimate(null, 100_000, below)).toMatchObject({ cents: 100_000, lowCents: 100_000, highCents: 100_000 });
  });

  it('se replie sur le minimum légal, et sur la grille quand l’annonce y renvoie', () => {
    expect(payEstimate(null, 100_000, null)).toMatchObject({ source: 'minimum', cents: 100_000 });
    expect(payEstimate(null, 100_000, community, true)).toMatchObject({ source: 'minimum', legalGrid: true });
  });
});

describe('mentionsLegalGrid', () => {
  it('reconnaît les formules courantes', () => {
    expect(mentionsLegalGrid('Rémunération selon la grille légale')).toBe(true);
    expect(mentionsLegalGrid('Salaire en fonction de l’âge et de l’année')).toBe(true);
    expect(mentionsLegalGrid(null, 'Rémunération selon législation en vigueur')).toBe(true);
    expect(mentionsLegalGrid('Tickets restaurant et mutuelle')).toBe(false);
  });
});

describe('summarizePercents', () => {
  it('donne la médiane et les quartiles', () => {
    expect(summarizePercents('1', [0, 10, 20, 30, 40])).toEqual({ siren: '1', count: 5, medianPercent: 20, lowPercent: 10, highPercent: 30 });
  });
});

describe('salaire habituel de l’entreprise', () => {
  it('sert seulement sans montant, sans déclaration et avec assez d’annonces chiffrées', () => {
    expect(payEstimate(null, 100_000, null, false, { count: 4, medianCents: 150_000 })).toMatchObject({ source: 'entreprise', cents: 150_000, count: 4 });
    expect(payEstimate(null, 100_000, null, false, { count: 2, medianCents: 150_000 }).source).toBe('minimum');
    expect(payEstimate(null, 100_000, null, true, { count: 4, medianCents: 150_000 }).source).toBe('minimum');
    expect(payEstimate(120_000, 100_000, null, false, { count: 4, medianCents: 150_000 }).source).toBe('annonce');
  });

  it('sans aucune donnée : non précisé, sans verdict', () => {
    expect(payDisplay(payEstimate(null, 100_000, null), 100_000)).toMatchObject({ kind: 'inconnu', tier: null, word: 'Non précisé' });
  });
});
