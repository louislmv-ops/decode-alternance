import { describe, expect, it } from 'vitest';
import { bingo, findJargon, fold, uniqueHits } from './jargon';

describe('Bullshit Bingo', () => {
  it('plie le texte sans changer les positions', () => {
    const t = 'Équipe dynamique, très « start-up » 🚀 !';
    expect(fold(t)).toHaveLength(t.length);
    expect(fold('Équipe')).toBe('equipe');
  });

  it('repère les formules malgré les accents, la casse et la ponctuation', () => {
    const t = 'Rejoins un environnement très dynamique ! Esprit start-up, rémunération selon profil.';
    const hits = findJargon(t);
    expect(hits.map((h) => h.id)).toEqual(['dynamique', 'startup', 'salaire']);
    expect(hits[0]!.text).toBe('environnement très dynamique');
    expect(t.slice(hits[1]!.start, hits[1]!.end)).toBe('Esprit start-up');
  });

  it('ne prend pas un mot dans un autre', () => {
    expect(findJargon('La rigueur budgétaire').map((h) => h.id)).toEqual(['rigueur']);
    expect(findJargon('Les autonomistes corses')).toEqual([]);
  });

  it('passe les expressions de l’IA d’abord, et les trouve même mal ponctuées', () => {
    const t = 'Tu seras force de proposition sur des sujets transverses à forte visibilité.';
    const hits = findJargon(t, [{ expression: 'Sujets transverses, à forte visibilité', traduction: 'Tes chefs verront ton travail.' }]);
    expect(hits.map((h) => h.id)).toEqual(['proposition', null]);
    // L'IA a repéré « force de proposition » : sa traduction gagne, et la case est cochée.
    const both = findJargon('Sois force de proposition.', [{ expression: 'force de proposition', traduction: 'Propose des idées.' }]);
    expect(both).toMatchObject([{ id: 'proposition', traduction: 'Propose des idées.' }]);
    expect(hits[1]!.text).toBe('sujets transverses à forte visibilité');
    expect(hits[1]!.traduction).toBe('Tes chefs verront ton travail.');
  });

  it('ne garde qu’une ligne par formule dans la liste', () => {
    expect(uniqueHits(findJargon('Autonome. Très autonome. Autonomie totale.'))).toHaveLength(1);
  });

  it('coche la grille et compte les lignes', () => {
    const t = 'Environnement dynamique, poste polyvalent, profil autonome.';
    const b = bingo(findJargon(t));
    expect(b.cells.filter((c) => c.found).map((c) => c.id)).toEqual(['dynamique', 'polyvalent', 'autonome']);
    expect(b.lines).toBe(1);
    expect(bingo([]).lines).toBe(0);
  });
});
