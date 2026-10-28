import { describe, expect, it } from 'vitest';
import { guessFromCv } from './extract';

const NOW = new Date(2026, 9, 22);

const CV = `Inès Martin
12 rue des Lilas, 35000 Rennes
inès@example.com · 06 00 00 00 00 · 21 ans

Recherche une alternance en marketing digital à partir de septembre

Formation
2025-2027 Master Marketing et communication, IAE de Rennes
2022-2025 Licence Économie-gestion
2022 Baccalauréat général

Expériences
Stage chargée de marketing, campagnes SEO et réseaux sociaux
Été 2023 : vendeuse en boulangerie

Compétences : Canva, Google Analytics, Excel, anglais courant`;

describe('guessFromCv', () => {
  it('lit le poste précis, le lieu, la formation en cours, les compétences et l’âge', () => {
    const g = guessFromCv(CV, NOW);
    expect(g.job).toBe('chargé de marketing digital');
    expect(g.jobs).not.toContain('boulanger');
    expect(g).toMatchObject({ department: '35', city: 'Rennes', level: 7, age: 21 });
    expect(g.formation).toBe('Master Marketing et communication');
    expect(g.skills).toEqual(['SEO', 'Canva', 'Google Analytics', 'Excel', 'Anglais']);
  });

  it('prend la formation en cours plutôt que le plus haut diplôme cité', () => {
    const g = guessFromCv(`Lucas Petit\nLyon\nBTS Management commercial opérationnel (MCO) en alternance, 2026-2028\nProjet : poursuivre en master plus tard`, NOW);
    expect(g.level).toBe(5);
    expect(g.formation).toMatch(/^BTS Management commercial/);
    expect(g).toMatchObject({ department: '69', city: 'Lyon' });
  });

  it('ne retient pas un petit boulot passé comme poste visé', () => {
    const g = guessFromCv(
      `Sarah Benali\nDéveloppeuse full stack en alternance\nRecherche une alternance de développeur full stack\nExpériences : serveuse (été 2024), serveuse (été 2025)\nReact, Node.js, SQL, Git`,
      NOW,
    );
    expect(g.job).toBe('développeur full stack');
    expect(g.jobs).not.toContain('serveur');
    expect(g.skills).toEqual(['React', 'Node.js', 'SQL', 'Git']);
  });

  it('calcule l’âge depuis une date de naissance', () => {
    expect(guessFromCv('Née le 14/03/2004', NOW).age).toBe(22);
  });

  it('laisse vide ce qu’il ne trouve pas', () => {
    expect(guessFromCv('Bonjour', NOW)).toEqual({ job: null, jobs: [], department: null, city: null, level: null, formation: null, skills: [], age: null });
  });
});
