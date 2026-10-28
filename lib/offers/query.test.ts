import { describe, expect, it } from 'vitest';
import { canonicalQuery, expandQuery, matchesQuery } from './query';

describe('recherche', () => {
  it('cherche aussi les mots des annonces', () => {
    expect(expandQuery('dev')).toEqual(['dev', 'développeur', 'développement']);
    expect(expandQuery('RH')).toEqual(['RH', 'ressources humaines']);
    expect(expandQuery('marketing')).toEqual(['marketing']);
    expect(expandQuery('boulanger')).toEqual(['boulanger']);
    expect(expandQuery('  ')).toEqual([]);
  });

  it('donne aux API la forme la plus courante', () => {
    expect(canonicalQuery('compta')).toBe('comptable');
    expect(canonicalQuery('boulanger')).toBe('boulanger');
    expect(canonicalQuery(undefined)).toBeUndefined();
  });

  it('ignore les accents et la casse', () => {
    expect(matchesQuery('Développeur Web H/F', 'developpeur')).toBe(true);
    expect(matchesQuery('Chargé de ressources humaines', 'rh')).toBe(true);
  });

  it('cherche au début des mots : « rh » ne trouve pas « Rhône »', () => {
    expect(matchesQuery('Assistant commercial, Rhône', 'rh')).toBe(false);
    expect(matchesQuery('Assistant marketing', 'market')).toBe(true);
  });

  it('demande tous les mots d’une variante', () => {
    expect(matchesQuery('Chef de projet digital, Lyon', 'chef de projet lyon')).toBe(true);
    expect(matchesQuery('Chef de projet digital, Paris', 'chef de projet lyon')).toBe(false);
  });
});
