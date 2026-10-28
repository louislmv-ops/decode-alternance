import { describe, expect, it } from 'vitest';
import { categoryOf } from './offers/category';
import { afterDecision, EMPTY_MEMORY, parseMemory, unhide } from './swipe';

const commerce = { key: 'D', label: 'Commerce, vente' };
const data = { key: 'M18', label: 'Informatique, numérique' };

describe('masquage des catégories au swipe', () => {
  it('masque une catégorie au troisième refus d’affilée', () => {
    let m = EMPTY_MEMORY;
    m = afterDecision(m, commerce, 'left').memory;
    m = afterDecision(m, commerce, 'left').memory;
    const third = afterDecision(m, commerce, 'left');
    expect(third.hid).toEqual(commerce);
    expect(third.memory.hidden).toEqual({ D: 'Commerce, vente' });
    expect(third.memory.streaks.D).toBeUndefined();
  });

  it('un « je garde » remet le compteur à zéro', () => {
    let m = EMPTY_MEMORY;
    m = afterDecision(m, commerce, 'left').memory;
    m = afterDecision(m, commerce, 'left').memory;
    m = afterDecision(m, commerce, 'right').memory;
    expect(afterDecision(m, commerce, 'left').hid).toBeNull();
  });

  it('les autres catégories ne cassent pas la série', () => {
    let m = EMPTY_MEMORY;
    m = afterDecision(m, commerce, 'left').memory;
    m = afterDecision(m, data, 'right').memory;
    m = afterDecision(m, commerce, 'left').memory;
    expect(afterDecision(m, commerce, 'left').hid).toEqual(commerce);
  });

  it('une offre sans catégorie ne compte pas', () => {
    expect(afterDecision(EMPTY_MEMORY, null, 'left')).toEqual({ memory: EMPTY_MEMORY, hid: null });
  });

  it('rétablit une catégorie et relit une mémoire abîmée', () => {
    expect(unhide({ streaks: {}, hidden: { D: 'x' } }, 'D').hidden).toEqual({});
    expect(parseMemory('{pas du json')).toEqual(EMPTY_MEMORY);
    expect(parseMemory(JSON.stringify({ streaks: { D: 2, X: 'a', Y: 9 }, hidden: { M18: 'Info', Z: 3 } }))).toEqual({ streaks: { D: 2 }, hidden: { M18: 'Info' } });
  });
});


describe('catégorie d’une offre', () => {
  it('prend le secteur ROME, sinon le domaine de l’intitulé', () => {
    expect(categoryOf({ title: 'Vendeur', romeCode: 'D1214' })).toEqual({ key: 's:D', label: 'Commerce, vente' });
    expect(categoryOf({ title: 'Assistant marketing digital' })).toEqual({ key: 'd:marketing', label: 'Marketing' });
    expect(categoryOf({ title: 'Poste mystère' })).toBeNull();
  });
});
