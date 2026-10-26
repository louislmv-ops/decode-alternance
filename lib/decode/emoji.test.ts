import { describe, expect, it } from 'vitest';
import { isEmoji, splitEmoji } from './emoji';

describe('emojis des puces', () => {
  it('sépare l’emoji de tête', () => {
    expect(splitEmoji('💸 Bien payé', '✅')).toEqual(['💸', 'Bien payé']);
    expect(splitEmoji('🧑‍💻 Code en équipe', '✅')).toEqual(['🧑‍💻', 'Code en équipe']);
  });

  it('met l’emoji par défaut quand il manque', () => {
    expect(splitEmoji('Bonne ambiance', '✅')).toEqual(['✅', 'Bonne ambiance']);
    expect(splitEmoji('Le salaire est au-dessus du minimum', '✅')[0]).toBe('💸');
    expect(isEmoji(undefined)).toBe(false);
    expect(isEmoji('abc')).toBe(false);
  });
});
