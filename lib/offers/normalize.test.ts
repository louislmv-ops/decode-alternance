import { describe, expect, it } from 'vitest';
import {
  departmentFromPostalCode,
  detectContract,
  detectDiplomaLevel,
  fingerprint,
  htmlToText,
  isAlternance,
  parseSalary,
  schoolBaitFlags,
  sizeFromHeadcount,
} from './normalize';

describe('htmlToText', () => {
  it('garde les paragraphes et les puces', () => {
    expect(htmlToText('<p>Missions&nbsp;:</p><ul><li>Reporting</li><li>Analyse</li></ul>')).toBe('Missions :\n• Reporting\n• Analyse');
  });
  it('décode les entités numériques', () => {
    expect(htmlToText('Caf&#233; &amp; th&eacute;')).toBe('Café & thé');
  });
});

describe('isAlternance', () => {
  it('reconnaît l’alternance dans le titre', () => {
    expect(isAlternance('Assistant contrôle de gestion (H/F) - Alternance')).toBe(true);
    expect(isAlternance('Apprenti(e) boulanger')).toBe(true);
    expect(isAlternance('Work-study Data analyst')).toBe(true);
  });
  it('écarte un CDI ou un stage', () => {
    expect(isAlternance('Contrôleur de gestion CDI', 'Poste en CDI à pourvoir immédiatement')).toBe(false);
    expect(isAlternance('Stage marketing 6 mois')).toBe(false);
  });
});

describe('detectContract', () => {
  it('distingue les deux contrats', () => {
    expect(detectContract('Contrat de professionnalisation 12 mois')).toBe('professionnalisation');
    expect(detectContract('Contrat d’apprentissage de 24 mois')).toBe('apprentissage');
    expect(detectContract('Alternance, rythme 3/2')).toBe('alternance');
  });
});

describe('detectDiplomaLevel', () => {
  it('prend le niveau le plus bas mentionné', () => {
    expect(detectDiplomaLevel('Formation Bac+3 à Bac+5 en finance')).toBe(6);
    expect(detectDiplomaLevel('Préparation d’un BTS NDRC')).toBe(5);
    expect(detectDiplomaLevel('Master 2 contrôle de gestion')).toBe(7);
    expect(detectDiplomaLevel('CAP boulanger')).toBe(3);
  });
  it('ne confond pas le mot anglais « but »', () => {
    expect(detectDiplomaLevel('Not required, but welcome')).toBeNull();
  });
});

describe('parseSalary', () => {
  it('lit un montant mensuel', () => {
    expect(parseSalary('1 200 € brut par mois')).toBe(120_000);
    expect(parseSalary('Mensuel de 1450.50 Euros sur 12 mois')).toBe(145_050);
  });
  it('ramène un montant annuel au mois', () => {
    expect(parseSalary('Annuel de 18000 € brut')).toBe(150_000);
    expect(parseSalary('18k€ par an')).toBe(150_000);
  });
  it('ramène un taux horaire au mois', () => {
    expect(parseSalary('Horaire de 12.31 Euros sur 12 mois')).toBe(186_706);
  });
  it('calcule un pourcentage du SMIC', () => {
    expect(parseSalary('53 % du SMIC')).toBe(98_952);
  });
  it('prend la borne basse d’une fourchette', () => {
    expect(parseSalary('Entre 1 100 € et 1 300 € par mois')).toBe(110_000);
  });
  it('renvoie null quand rien n’est chiffré', () => {
    expect(parseSalary('Selon grille légale')).toBeNull();
    expect(parseSalary(null)).toBeNull();
  });
});

describe('departmentFromPostalCode', () => {
  it('gère la métropole, la Corse et l’outre-mer', () => {
    expect(departmentFromPostalCode('75012')).toBe('75');
    expect(departmentFromPostalCode('20000')).toBe('2A');
    expect(departmentFromPostalCode('20200')).toBe('2B');
    expect(departmentFromPostalCode('97400')).toBe('974');
    expect(departmentFromPostalCode('750')).toBeNull();
  });
});

describe('sizeFromHeadcount', () => {
  it('classe les tranches d’effectif', () => {
    expect(sizeFromHeadcount('6 à 9 salariés')).toBe('tpe');
    expect(sizeFromHeadcount('50 à 99 salariés')).toBe('pme');
    expect(sizeFromHeadcount('1000 à 1999 salariés')).toBe('eti');
    expect(sizeFromHeadcount('10 000 salariés et plus')).toBe('grande');
    expect(sizeFromHeadcount(null)).toBeNull();
  });
});

describe('fingerprint', () => {
  it('rapproche la même offre écrite deux fois', () => {
    const a = fingerprint('Orange SA', 'Alternance - Chargé(e) de communication interne H/F', 'Paris 15e');
    const b = fingerprint('ORANGE', 'Chargé(e) de communication interne (F/H) en alternance', 'Paris');
    expect(a).toBe(b);
  });
  it('sépare deux villes', () => {
    expect(fingerprint('Orange', 'Développeur', 'Lyon')).not.toBe(fingerprint('Orange', 'Développeur', 'Lille'));
  });
});

describe('schoolBaitFlags', () => {
  it('repère une école qui recrute des élèves', () => {
    const flags = schoolBaitFlags({
      company: 'Business School Exemple',
      title: 'Alternance assistant RH',
      description: 'Inscris-toi à notre formation, rentrée en octobre. Frais de dossier offerts.',
    });
    expect(flags.length).toBeGreaterThanOrEqual(3);
  });
  it('laisse tranquille une vraie offre', () => {
    expect(
      schoolBaitFlags({ company: 'Boulangerie Martin', title: 'Apprenti boulanger', description: 'Tu prépares un CAP.' }),
    ).toEqual([]);
  });
});

describe('fingerprint et écriture inclusive', () => {
  it('ignore le (e) de l’écriture inclusive', () => {
    expect(fingerprint('Groupe Orvane', 'Alternance - Chargé(e) d’études marketing H/F', 'Paris 9e')).toBe(
      fingerprint('Orvane', 'Chargé d’études marketing (H/F) en alternance', 'Paris'),
    );
  });
});

describe('écoles connues (liste La bonne alternance) et code NAF 85', async () => {
  const { isKnownSchool, schoolBaitFlags } = await import('./normalize');
  it('reconnaît une école de la liste, même avec accents ou suffixe', () => {
    expect(isKnownSchool('Youschool')).toBe(true);
    expect(isKnownSchool('WIN Lyon')).toBe(true);
    expect(isKnownSchool('Boulangerie Martin')).toBe(false);
  });
  it('signale un employeur du secteur de l’enseignement', () => {
    expect(schoolBaitFlags({ company: 'Société X', title: 'Assistant', description: '', naf: '8559A' })).toHaveLength(1);
    expect(schoolBaitFlags({ company: 'Société X', title: 'Assistant', description: '', naf: '4711D' })).toHaveLength(0);
  });
});
