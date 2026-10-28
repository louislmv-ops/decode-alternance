import { describe, expect, it } from 'vitest';
import { DOMAINS } from './domains';
import { allLandings, CITIES, findLanding, landingFilters, landingHref, landingTitle, placeText, slugify } from './landing';

describe('pages métier et ville', () => {
  it('donne une adresse propre à chaque métier', () => {
    expect(slugify('Ressources humaines')).toBe('ressources-humaines');
    expect(slugify('Développeur')).toBe('developpeur');
    expect(slugify('Hôtellerie')).toBe('hotellerie');
  });

  it('crée une page par métier, par ville et par couple, sans doublon', () => {
    const slugs = allLandings().map((l) => l.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs.length).toBe(DOMAINS.length + CITIES.length + DOMAINS.length * CITIES.length);
  });

  it('retrouve le métier et la ville, même quand ils contiennent des tirets', () => {
    const l = findLanding('ressources-humaines-clermont-ferrand');
    expect(l?.domain?.label).toBe('Ressources humaines');
    expect(l?.city?.name).toBe('Clermont-Ferrand');
    expect(findLanding('nimporte-quoi')).toBeNull();
  });

  it('chaque adresse construite renvoie à sa page', () => {
    for (const l of allLandings()) expect(findLanding(landingHref(l.domain, l.city).replace('/alternance/', ''))).toEqual(l);
  });

  it('cherche dans le département de la ville', () => {
    const l = findLanding('data-lyon')!;
    expect(landingTitle(l)).toBe('Alternance data à Lyon');
    expect(placeText(l.city)).toBe('à Lyon (Rhône, 69)');
    expect(landingFilters(l)).toEqual({ q: 'data', departments: ['69'], sort: 'top' });
    expect(landingTitle(findLanding('btp')!)).toBe('Alternance BTP');
    expect(placeText(findLanding('paris')!.city)).toBe('à Paris (75)');
  });
});
