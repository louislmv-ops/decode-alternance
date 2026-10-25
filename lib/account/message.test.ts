import { describe, expect, it } from 'vitest';
import { applicationMessage } from './message';

describe('message de candidature', () => {
  it('reprend le dossier et l’offre', () => {
    const m = applicationMessage(
      { firstName: 'Léa', lastName: 'Martin', school: 'BTS MCO', phone: '06 12 34 56 78', available: 'septembre', pitch: 'J’adore la vente.' },
      { title: 'Conseillère de vente', company: 'Maison Sorel' },
    );
    expect(m).toContain('Je m’appelle Léa Martin, je suis en BTS MCO et je candidate à votre offre d’alternance « Conseillère de vente » chez Maison Sorel.');
    expect(m).toContain('J’adore la vente.');
    expect(m).toContain('Je suis disponible à partir de septembre.');
    expect(m.endsWith('Léa Martin\n06 12 34 56 78')).toBe(true);
  });

  it('reste correct avec un dossier vide', () => {
    expect(applicationMessage({}, { title: 'Développeur web', company: null })).toContain('Je candidate à votre offre d’alternance « Développeur web ».');
  });
});
