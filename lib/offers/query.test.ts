import { describe, expect, it } from 'vitest';
import { canonicalQuery, expandQuery, matchesQuery, queryTerms, tsQueryText } from './query';

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

describe('recherche libre', () => {
  it('découpe la saisie en termes, sans les mots vides', () => {
    expect(queryTerms('consultant en transformation digitale')).toEqual([
      ['consultant', 'conseil', 'consulting'],
      ['transformation digitale', 'transformation numérique', 'digital transformation'],
    ]);
    expect(queryTerms('alternance boulanger')).toEqual([['boulanger']]);
  });

  it('trouve une offre qui dit les choses autrement', () => {
    expect(matchesQuery('Alternance - Consulting transformation numérique, Paris', 'consultant transformation digitale')).toBe(true);
    expect(matchesQuery('Consultant SAP', 'consultant transformation digitale')).toBe(false);
  });

  it('écrit une requête Postgres sûre', () => {
    expect(tsQueryText(queryTerms('rh paris'), '&')).toBe('((rh) | (ressources:* & humaines:*)) & ((paris:*))');
    // Seulement des lettres, des chiffres et la syntaxe que l'on écrit soi-même.
    expect(tsQueryText(queryTerms("dev'); drop table offers;--"), '&')).toMatch(/^[a-z0-9:*&|() ]+$/);
    expect(tsQueryText([], '&')).toBeNull();
  });

  it('donne aux API les mots utiles', () => {
    expect(canonicalQuery('alternance consultant digital')).toBe('consultant digital');
  });
});
