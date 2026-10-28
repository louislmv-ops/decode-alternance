import { describe, expect, it } from 'vitest';
import { conventionMinimum, minimumSalary } from './salary';
import { CONVENTION_GRIDS, gridFor } from './convention-grids';
import { APPRENTISSAGE_RATES, PROFESSIONNALISATION_RATES, SMIC } from './reference';

const appr = (age: number, year: number) => ({ contract: 'apprentissage' as const, age, year, hasBacPro: false });

describe('grilles des conventions collectives', () => {
  it('chaque grille dit sa source et ne descend jamais sous le minimum légal', () => {
    for (const g of CONVENTION_GRIDS) {
      expect(g.idcc).toMatch(/^\d{4}$/);
      for (const b of g.apprentissage?.brackets ?? []) {
        const legal = APPRENTISSAGE_RATES.find((l) => b.minAge <= l.maxAge && b.maxAge >= l.minAge)!;
        b.byYear.forEach((rate, i) => expect(rate * (g.months ?? 12) / 12).toBeGreaterThanOrEqual(legal.byYear[i]! - 0.0001));
      }
      for (const b of g.professionnalisation?.brackets ?? []) {
        const legal = PROFESSIONNALISATION_RATES.find((l) => b.minAge >= l.minAge && b.minAge <= l.maxAge)!;
        expect(b.withBac).toBeGreaterThanOrEqual(legal.withBac);
      }
      expect(g.apprentissage?.source.article ?? g.professionnalisation?.source.article).toMatch(/^KALIARTI\d{12}$/);
    }
  });

  it('métallurgie, 20 ans, 1re année : 55 % du SMIC au lieu de 43 %', () => {
    const m = conventionMinimum(appr(20, 1), ['3248'])!;
    expect(m).toMatchObject({ rate: 55, idcc: '3248', name: 'Métallurgie' });
    expect(m.cents).toBe(Math.round(SMIC.monthlyCents * 0.55));
    expect(m.cents).toBeGreaterThan(minimumSalary(appr(20, 1)).cents);
  });

  it('banque : les taux légaux sur 13 mois', () => {
    const m = conventionMinimum(appr(22, 2), ['2120'])!;
    expect(m.months).toBe(13);
    expect(m.cents).toBe(Math.round((SMIC.monthlyCents * 61 * 13) / 12 / 100));
  });

  it('Syntec dépend du diplôme préparé ; sans niveau connu, rien', () => {
    expect(conventionMinimum(appr(22, 1), ['1486'], 7)?.rate).toBe(65);
    expect(conventionMinimum(appr(22, 1), ['1486'], 5)?.rate).toBe(55);
    expect(conventionMinimum(appr(22, 1), ['1486'], null)).toBeNull();
  });

  it('rien quand la convention ne fait pas mieux que la loi, ou est inconnue', () => {
    expect(conventionMinimum(appr(27, 1), ['3248'])).toBeNull();
    expect(conventionMinimum(appr(20, 1), ['9999'])).toBeNull();
    expect(gridFor('44')?.name).toBe('Industries chimiques');
  });

  it('contrat pro, métallurgie, 22 ans avec bac pro : 85 %', () => {
    expect(conventionMinimum({ contract: 'professionnalisation', age: 22, year: 1, hasBacPro: true }, ['3248'])?.rate).toBe(85);
  });
});
