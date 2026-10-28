import { describe, expect, it } from 'vitest';
import { detailsOf, remoteOf, skillsOf } from './details';

describe('télétravail lu dans l’annonce', () => {
  it('reconnaît le télétravail partiel', () => {
    expect(remoteOf('Télétravail 2 jours par semaine')).toBe('partiel');
    expect(remoteOf('Organisation hybride entre le siège et la maison')).toBe('partiel');
  });

  it('reconnaît le télétravail complet', () => {
    expect(remoteOf('Poste en full remote')).toBe('total');
    expect(remoteOf('100 % télétravail')).toBe('total');
  });

  it('reconnaît l’absence de télétravail, même si le mot apparaît', () => {
    expect(remoteOf('Pas de télétravail possible sur ce poste')).toBe('aucun');
    expect(remoteOf('Télétravail : non')).toBe('aucun');
  });

  it('ne devine rien quand l’annonce n’en parle pas', () => {
    expect(remoteOf('Tu rejoins l’équipe marketing à Lyon.')).toBeNull();
  });
});

describe('compétences citées', () => {
  it('trouve les outils, sans tenir compte de la casse ni des accents', () => {
    expect(skillsOf('Maîtrise d’EXCEL et de Power BI, notions de SQL')).toEqual(['excel', 'sql', 'power-bi']);
  });

  it('ne prend pas un mot dans un autre', () => {
    // « java » n'est pas dans « javascript », « sap » n'est pas dans « sapeur ».
    expect(skillsOf('Développeur JavaScript')).toEqual(['javascript']);
    expect(skillsOf('Sapeur-pompier volontaire bienvenu')).toEqual([]);
  });

  it('reconnaît un niveau d’anglais demandé', () => {
    expect(skillsOf('Anglais professionnel exigé')).toContain('anglais');
  });
});

describe('detailsOf', () => {
  it('garde ce que la base a déjà calculé', () => {
    expect(detailsOf({ title: 'x', description: 'full remote', remote: null, skills: [] })).toEqual({ remote: null, skills: [] });
  });

  it('lit le texte quand la base ne l’a pas fait', () => {
    expect(detailsOf({ title: 'Data analyst', description: 'Télétravail partiel. Python et SQL.' })).toEqual({ remote: 'partiel', skills: ['sql', 'python'] });
  });
});
