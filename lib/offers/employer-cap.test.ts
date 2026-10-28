import { describe, expect, it } from 'vitest';
import { capPerEmployer, employerKey, onePerEmployer } from './rank';

const list = (companies: (string | null)[]) => companies.map((company, i) => ({ id: String(i), company }));
const perPage = (offers: { company: string | null }[], size: number) => {
  const pages: Record<string, number>[] = [];
  offers.forEach((o, i) => {
    const page = (pages[Math.floor(i / size)] ??= {});
    const k = employerKey(o.company);
    if (k) page[k] = (page[k] ?? 0) + 1;
  });
  return pages;
};

describe('plafond par employeur', () => {
  it('au plus 2 offres du même employeur par page, les suivantes repoussées à la page d’après', () => {
    const offers = list(['Capgemini', 'Capgemini Engineering', 'CAPGEMINI SE', 'Safran', 'Safran', 'Safran', ...Array.from({ length: 30 }, (_, i) => `PME ${i}`), 'Capgemini Invent']);
    const out = capPerEmployer(offers, 2, 20);
    expect(out).toHaveLength(offers.length);
    expect(new Set(out.map((o) => o.id)).size).toBe(offers.length);
    const [p1, p2] = perPage(out, 20);
    expect(p1!.capgemini).toBe(2);
    expect(p1!.safran).toBe(2);
    // Les offres repoussées ouvrent la page suivante, dans leur ordre.
    expect(out.slice(20, 22).map((o) => o.company)).toEqual(['CAPGEMINI SE', 'Safran']);
    expect(p2!.capgemini).toBe(2);
  });
  it('remplit la page dans l’ordre s’il n’y a pas assez d’employeurs différents', () => {
    const out = capPerEmployer(list(['A', 'A', 'A', 'B']), 2, 3);
    expect(out.map((o) => o.company)).toEqual(['A', 'A', 'B', 'A']);
  });
  it('ne plafonne pas les offres sans employeur', () => {
    const out = capPerEmployer(list([null, null, null]), 1, 3);
    expect(out.map((o) => o.id)).toEqual(['0', '1', '2']);
  });
  it('accueil : une seule offre par employeur', () => {
    expect(onePerEmployer(list(['Carrefour', 'Carrefour Market', 'Safran', 'Safran SA', 'Orange'])).map((o) => o.company)).toEqual([
      'Carrefour',
      'Safran',
      'Orange',
    ]);
  });
});
