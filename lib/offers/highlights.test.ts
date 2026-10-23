import { describe, expect, it } from 'vitest';
import { isCac40 } from './companies';
import { highlights } from './highlights';

const profile = { age: 20, contract: 'apprentissage' as const, year: 1 as const, hasBacPro: false, filled: true };
const base = { companySize: null, salaryMonthlyCents: null, schoolFlags: [], company: 'Boulangerie Martin', description: '' };
const community = { siren: '1', count: 5, medianPercent: 30, lowPercent: 20, highPercent: 40 };

describe('pépites', () => {
  it('reconnaît un groupe du CAC 40 sans se tromper de nom', () => {
    expect(isCac40('BNP PARIBAS SA')).toBe(true);
    expect(isCac40('Société Générale')).toBe(true);
    expect(isCac40('Orange Business')).toBe(true);
    expect(isCac40('L’Orange Bleue')).toBe(false);
  });
  it('reste rare : grand groupe ET bien payé', () => {
    expect(highlights({ ...base, companySize: 'grande' }, profile).pepite).toBe(false);
    expect(highlights({ ...base, salaryMonthlyCents: 300_000 }, profile).pepite).toBe(false);
    expect(highlights({ ...base, companySize: 'grande', salaryMonthlyCents: 300_000, title: 'Chef de projet digital' }, profile).pepite).toBe(true);
    expect(highlights({ ...base, company: 'Thales', title: 'Ingénieur systèmes' }, profile, community).pepite).toBe(true);
    expect(highlights({ ...base, company: 'Thales' }, profile).pepite).toBe(false);
  });
  it('jamais pour un poste peu qualifié, même bien payé dans un grand groupe', () => {
    const big = { ...base, companySize: 'grande' as const, salaryMonthlyCents: 186_700 };
    expect(highlights({ ...big, title: 'Futur Agent de Sécurité' }, profile).pepite).toBe(false);
    expect(highlights({ ...big, title: 'Auxiliaire de vie en alternance' }, profile).pepite).toBe(false);
    expect(highlights({ ...big, title: 'Assistant marketing', diplomaLevel: 7 }, profile).pepite).toBe(true);
  });
  it('jamais pour une offre d’école', () => {
    expect(highlights({ ...base, companySize: 'grande', salaryMonthlyCents: 300_000, schoolFlags: ['école'] }, profile).pepite).toBe(false);
  });
});
