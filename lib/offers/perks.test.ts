import { describe, expect, it } from 'vitest';
import { extractPerks, mergePerks } from './perks';

describe('extractPerks', () => {
  it('repère les avantages écrits dans l’annonce', () => {
    const text = 'Télétravail 2 jours par semaine, tickets restaurant, remboursement à 50 % de ton abonnement de transport, mutuelle, 13e mois et possibilité d’embauche en CDI.';
    expect(extractPerks(text)).toEqual(['Télétravail', 'Tickets resto ou cantine', 'Transport remboursé', 'Mutuelle', 'Primes ou 13e mois', 'Embauche possible à la fin']);
  });

  it('ne confond pas « exprimer » avec une prime ni « transport » avec du sport', () => {
    expect(extractPerks('Tu sais t’exprimer à l’oral. Secteur du transport.')).toEqual([]);
  });

  it('fusionne avec l’IA sans doublon', () => {
    expect(mergePerks(['Télétravail 2 jours'], ['Télétravail', 'Mutuelle'])).toEqual(['Télétravail 2 jours', 'Mutuelle']);
    expect(mergePerks(['13e mois', 'Tickets restaurant'], ['Tickets resto ou cantine', 'Primes ou 13e mois', 'RTT'])).toEqual(['13e mois', 'Tickets restaurant', 'RTT']);
  });
});
