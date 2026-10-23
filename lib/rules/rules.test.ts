import { describe, expect, it } from 'vitest';
import { apprenticeNetThresholdCents, comparePay, minimumSalary } from './salary';
import { employerFigures } from './employer';

describe('minimumSalary', () => {
  it('applique 53 % du SMIC à 21 ans en première année d’apprentissage', () => {
    const m = minimumSalary({ contract: 'apprentissage', age: 21, year: 1, hasBacPro: false });
    expect(m.rate).toBe(53);
    expect(m.cents).toBe(98_952); // 1 867,02 € × 53 %
    expect(m.conventionMayRaise).toBe(true);
  });

  it('suit la grille par âge et par année', () => {
    const rate = (age: number, year: number) =>
      minimumSalary({ contract: 'apprentissage', age, year, hasBacPro: false }).rate;
    expect([rate(17, 1), rate(17, 2), rate(17, 3)]).toEqual([27, 39, 55]);
    expect([rate(18, 1), rate(20, 2), rate(19, 3)]).toEqual([43, 51, 67]);
    expect([rate(25, 1), rate(23, 2), rate(21, 3)]).toEqual([53, 61, 78]);
    expect(rate(26, 1)).toBe(100);
  });

  it('borne l’année entre 1 et 3', () => {
    const at = (year: number) => minimumSalary({ contract: 'apprentissage', age: 19, year, hasBacPro: false }).rate;
    expect(at(0)).toBe(43);
    expect(at(5)).toBe(67);
  });

  it('distingue le contrat de professionnalisation et le niveau bac pro', () => {
    const pro = (age: number, hasBacPro: boolean) =>
      minimumSalary({ contract: 'professionnalisation', age, year: 1, hasBacPro }).rate;
    expect([pro(19, false), pro(19, true)]).toEqual([55, 65]);
    expect([pro(22, false), pro(22, true)]).toEqual([70, 80]);
    expect(pro(30, false)).toBe(100);
  });
});

describe('comparePay', () => {
  const min = 98_952;
  it('repère une offre sous le minimum légal', () => {
    expect(comparePay(90_000, min).verdict).toBe('sous-le-minimum');
  });
  it('considère quelques euros d’écart comme le minimum', () => {
    expect(comparePay(99_000, min).verdict).toBe('au-minimum');
  });
  it('surligne une offre payée au moins 20 % au-dessus', () => {
    const c = comparePay(120_000, min);
    expect(c.verdict).toBe('bien-paye');
    expect(c.diffPercent).toBe(21);
    expect(c.diffCents).toBe(21_048);
  });
});

describe('apprenticeNetThresholdCents', () => {
  it('vaut 50 % du SMIC mensuel', () => {
    expect(apprenticeNetThresholdCents()).toBe(93_351);
  });
});

describe('employerFigures', () => {
  it('donne l’aide unique de 5 000 € pour un bac pro dans une PME', () => {
    expect(employerFigures({ contract: 'apprentissage', size: 'moins-de-250', level: 4, disabledWorker: false }).aidCents).toBe(500_000);
  });
  it('donne 4 500 € pour un bac+2 et 2 000 € pour un master dans une PME', () => {
    expect(employerFigures({ contract: 'apprentissage', size: 'moins-de-250', level: 5, disabledWorker: false }).aidCents).toBe(450_000);
    const master = employerFigures({ contract: 'apprentissage', size: 'moins-de-250', level: 7, disabledWorker: false });
    expect(master.aidCents).toBe(200_000);
    expect(master.participationCents).toBe(75_000);
  });
  it('réduit l’aide dans une grande entreprise', () => {
    expect(employerFigures({ contract: 'apprentissage', size: '250-et-plus', level: 6, disabledWorker: false }).aidCents).toBe(75_000);
  });
  it('n’attribue pas d’aide exceptionnelle au contrat de professionnalisation', () => {
    expect(employerFigures({ contract: 'professionnalisation', size: 'moins-de-250', level: 5, disabledWorker: false }).aidCents).toBe(0);
  });
});

describe('contrat qui fixe le minimum', async () => {
  const { contractForOffer } = await import('./salary');
  it('suit le contrat de l’offre quand elle le précise, sinon le profil', () => {
    expect(contractForOffer('professionnalisation', 'apprentissage')).toBe('professionnalisation');
    expect(contractForOffer('alternance', 'apprentissage')).toBe('apprentissage');
    expect(contractForOffer(null, 'professionnalisation')).toBe('professionnalisation');
  });
});
