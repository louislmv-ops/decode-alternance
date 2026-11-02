import { describe, expect, it } from 'vitest';
import { DIPLOMA_LEVELS, employerFigures, employerPitch, type CompanySize, type DiplomaLevel } from './employer';
import { aidRowFor, EMPLOYER_AIDS, EMPLOYER_PARTICIPATION } from './employer-aids';

const euros = (cents: number) => `${(cents / 100).toLocaleString('fr-FR')} €`;
const SIZES: CompanySize[] = ['moins-de-250', '250-et-plus'];
const LEVELS = DIPLOMA_LEVELS.map((l) => l.level);

function pitchFor(size: CompanySize, level: DiplomaLevel, disabledWorker: boolean) {
  return employerPitch({
    contract: 'apprentissage',
    size,
    level,
    disabledWorker,
    minimumLabel: '1 000,00 €',
    levelLabel: DIPLOMA_LEVELS.find((l) => l.level === level)!.label,
    formatCents: euros,
  });
}

/** Les montants en euros cités dans un texte, en centimes. */
function amountsIn(text: string): number[] {
  return [...text.matchAll(/(\d[\d\s  ]*)(?:,\d+)?\s?€/g)].map((m) => Number(m[1]!.replace(/\D/g, '')) * 100);
}

describe('tableau des aides', () => {
  it('a exactement une ligne par cas (taille, niveau), et une ligne handicap par niveau', () => {
    for (const size of SIZES)
      for (const level of LEVELS) {
        expect(EMPLOYER_AIDS.filter((r) => !r.disabledWorker && r.size === size && r.levels.includes(level))).toHaveLength(1);
        expect(EMPLOYER_AIDS.filter((r) => r.disabledWorker && r.levels.includes(level))).toHaveLength(1);
      }
  });
  it('réserve l’aide unique aux niveaux 3 et 4 des entreprises de moins de 250 salariés', () => {
    for (const row of EMPLOYER_AIDS.filter((r) => r.scheme === 'aide-unique')) {
      expect(row.size).toBe('moins-de-250');
      expect(row.levels.every((l) => l <= 4)).toBe(true);
    }
  });
  it('ne donne aucune aide au contrat de professionnalisation', () => {
    expect(employerFigures({ contract: 'professionnalisation', size: 'moins-de-250', level: 5, disabledWorker: false }).aidCents).toBe(0);
  });
});

describe('texte à glisser dans la candidature', () => {
  it('ne cite jamais un montant d’aide incompatible avec le tableau', () => {
    for (const size of SIZES)
      for (const level of LEVELS)
        for (const disabled of [false, true]) {
          const text = pitchFor(size, level, disabled);
          const row = aidRowFor({ size, level, disabledWorker: disabled })!;
          const allowed = new Set([100_000, ...(row.verified ? [row.maxCents] : []), ...(EMPLOYER_PARTICIPATION.verified ? [EMPLOYER_PARTICIPATION.cents] : [])]);
          for (const cents of amountsIn(text)) expect(allowed, `${size} niveau ${level} : ${text}`).toContain(cents);
          if (!row.verified) expect(text).toContain('à vérifier auprès de l’ASP');
          else expect(text).toContain(row.legalRef);
          // Le texte ne cite un décret que s'il cite le montant qui en vient.
          if (!row.verified) expect(text).not.toMatch(/décret/i);
        }
  });
  it('n’attribue pas l’aide unique à un bac+3', () => {
    expect(pitchFor('moins-de-250', 6, false)).not.toMatch(/aide unique/i);
    expect(employerFigures({ contract: 'apprentissage', size: 'moins-de-250', level: 6, disabledWorker: false }).aid?.scheme).toBe('aide-exceptionnelle');
  });
  it('détecte un montant ajouté à la main', () => {
    expect(amountsIn('jusqu’à 2 000 € d’aide')).toEqual([200_000]);
  });
});
