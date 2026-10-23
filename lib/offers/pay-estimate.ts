// Le chiffre de paie d'une offre, du plus sûr au plus prudent :
// 1. le montant écrit dans l'annonce ;
// 2. ce que déclarent les alternants de la même entreprise (au moins MIN_TO_SHOW), ramené à ton âge et ton année ;
// 3. ton minimum légal, que l'employeur doit payer quoi qu'il arrive.
// Jamais un montant inventé : chaque chiffre dit d'où il vient.

/** Les salaires déclarés dans une entreprise, en écart à leur minimum légal (+12 = 12 % au-dessus). */
export interface CommunityPay {
  siren: string;
  count: number;
  medianPercent: number;
  /** Premier et troisième quartiles : la fourchette où se trouve la moitié des déclarations. */
  lowPercent: number;
  highPercent: number;
}

export type PaySource = 'annonce' | 'alternants' | 'minimum';

export interface PayEstimate {
  source: PaySource;
  /** Salaire mensuel brut retenu, en centimes. */
  cents: number;
  /** Fourchette, quand on en a une (déclarations des alternants). */
  lowCents: number | null;
  highCents: number | null;
  /** Nombre de déclarations, pour la source « alternants ». */
  count: number;
  /** L'annonce renvoie à la grille légale (« selon l'âge », « selon la législation »…). */
  legalGrid: boolean;
}

const strip = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const LEGAL_GRID =
  /(grille|bareme|remuneration|salaire)s?\s+(legale?|reglementaire|en vigueur)|selon\s+(la\s+)?(legislation|reglementation|grille|bareme|l['’]?\s?age|age)|en fonction de\s+(l['’]?\s?age|age|la\s+(grille|legislation))|pourcentage du smic/;

export function mentionsLegalGrid(...texts: (string | null | undefined)[]): boolean {
  return LEGAL_GRID.test(strip(texts.filter(Boolean).join(' ')));
}

/** Le minimum légal relevé d'un pourcentage ; jamais en dessous du minimum, que la loi impose. */
const above = (minimumCents: number, percent: number) => Math.max(minimumCents, Math.round((minimumCents * (100 + percent)) / 100));

export function payEstimate(announcedCents: number | null, minimumCents: number, community: CommunityPay | null, legalGrid = false): PayEstimate {
  if (announcedCents !== null) return { source: 'annonce', cents: announcedCents, lowCents: null, highCents: null, count: 0, legalGrid };
  if (community && community.count > 0 && !legalGrid) {
    return {
      source: 'alternants',
      cents: above(minimumCents, community.medianPercent),
      lowCents: above(minimumCents, community.lowPercent),
      highCents: above(minimumCents, community.highPercent),
      count: community.count,
      legalGrid,
    };
  }
  return { source: 'minimum', cents: minimumCents, lowCents: null, highCents: null, count: 0, legalGrid };
}

/** Pourquoi ces « € » : le texte du survol et des lecteurs d'écran, dans la liste. */
export function payEstimateHint(e: PayEstimate, tierLabel: string): string {
  if (e.source === 'annonce') return `${tierLabel} (salaire annoncé)`;
  if (e.source === 'alternants') return `${tierLabel}, estimé d’après ${e.count} alternants de cette entreprise`;
  return e.legalGrid ? 'L’annonce renvoie à la grille légale : ton minimum légal' : 'Pas de montant dans l’annonce : au moins ton minimum légal';
}

export function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sorted[lo]! + (sorted[hi]! - sorted[lo]!) * (pos - lo);
}

/** Les écarts au minimum de chaque déclaration (en %), résumés en médiane et quartiles. */
export function summarizePercents(siren: string, percents: number[]): CommunityPay {
  const v = [...percents].sort((a, b) => a - b);
  return {
    siren,
    count: v.length,
    medianPercent: Math.round(quantile(v, 0.5)),
    lowPercent: Math.round(quantile(v, 0.25)),
    highPercent: Math.round(quantile(v, 0.75)),
  };
}

/** Ce que la fiche d'une offre sait de la paie, en plus de l'annonce. Les montants personnels se calculent sur l'appareil. */
export interface PayContext {
  community: CommunityPay | null;
  legalGrid: boolean;
  /** Salaires médians déclarés par poste dans cette entreprise (au moins MIN_TO_SHOW chacun). */
  jobs: { jobTitle: string; count: number; medianCents: number | null }[];
  /** Les derniers avis publiés d'alternants de l'entreprise. */
  reviews: { id: string; jobTitle: string; startYear: number; overall: number; title: string; pros: string; cons: string; verified: boolean }[];
  reviewCount: number;
  companyHref: string | null;
  conventions: { idcc: string; name: string | null }[];
}
