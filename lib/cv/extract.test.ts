import { describe, expect, it } from 'vitest';
import { guessFromCv } from './extract';

const CV = `Inès Martin
12 rue des Lilas, 35000 Rennes
inès@example.com · 06 00 00 00 00 · 21 ans

Recherche une alternance en marketing digital à partir de septembre

Formation
2025-2027 Master Marketing et communication, IAE de Rennes
2022-2025 Licence Économie-gestion
2022 Baccalauréat général

Expériences
Stage chargée de marketing, campagnes SEO et réseaux sociaux`;

describe('guessFromCv', () => {
  it('lit le domaine, le lieu, le diplôme visé et l’âge', () => {
    expect(guessFromCv(CV)).toEqual({ job: 'marketing', department: '35', city: 'Rennes', level: 7, age: 21 });
  });

  it('calcule l’âge depuis une date de naissance', () => {
    expect(guessFromCv('Née le 14/03/2004', new Date(2026, 9, 22)).age).toBe(22);
  });

  it('laisse vide ce qu’il ne trouve pas', () => {
    expect(guessFromCv('Bonjour')).toEqual({ job: null, department: null, city: null, level: null, age: null });
  });
});
