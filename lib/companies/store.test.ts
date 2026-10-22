import { describe, expect, it } from 'vitest';
import { median, reviewStats, salaryStats, workDomain } from './store';

const row = (job: string, gross: number, min = 100_000) => ({ job_title: job, gross_cents: gross, minimum_cents: min });

describe('salaires', () => {
  it('ne montre rien sous 3 déclarations', () => {
    const s = salaryStats([row('Marketing', 120_000), row('Marketing', 130_000)]);
    expect(s.medianCents).toBeNull();
    expect(s.aboveMinimumPercent).toBeNull();
    expect(s.jobs).toEqual([]);
    expect(s.count).toBe(2);
  });

  it('donne la médiane, l’écart au minimum et les postes assez renseignés', () => {
    const s = salaryStats([row('Marketing', 110_000), row('marketing ', 120_000), row('Marketing', 130_000), row('Data', 90_000)]);
    expect(s.medianCents).toBe(115_000);
    expect(s.aboveMinimumPercent).toBe(15);
    expect(s.belowMinimum).toBe(1);
    expect(s.jobs).toEqual([{ jobTitle: 'Marketing', count: 3, medianCents: 120_000 }]);
  });

  it('calcule une médiane paire ou impaire', () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([1, 2, 3, 4])).toBe(3);
    expect(median([])).toBeNull();
  });
});

describe('avis', () => {
  const r = (overall: number, hired: 'oui' | 'non' | 'pas_encore') => ({ overall, tutoring: overall, missions: 4, atmosphere: 3, school_rhythm: 5, hired });

  it('masque les notes sous 3 avis', () => {
    expect(reviewStats([r(5, 'oui'), r(1, 'non')]).overall).toBeNull();
  });

  it('moyenne les notes et ne compte l’embauche que sur les contrats finis', () => {
    const s = reviewStats([r(5, 'oui'), r(4, 'oui'), r(3, 'non'), r(2, 'pas_encore')]);
    expect(s.overall).toBe(3.5);
    expect(s.criteria.schoolRhythm).toBe(5);
    expect(s.hiredPercent).toBe(67);
  });
});

describe('adresse pro', () => {
  it('refuse les messageries grand public', () => {
    expect(workDomain('ines@gmail.com')).toBeNull();
    expect(workDomain('ines@orange.fr')).toBeNull();
    expect(workDomain('pas une adresse')).toBeNull();
  });

  it('garde le domaine de l’entreprise', () => {
    expect(workDomain('Ines.Martin@Decathlon.com')).toBe('decathlon.com');
  });
});
