// Les goûts de la personne, appris de ses likes (et un peu des offres qu'elle passe en mode swipe) :
// les mots du poste, la région, le secteur, la taille d'entreprise, le niveau, les avantages.
// Tout reste dans le navigateur ; le calcul est simple et explicable : on dit toujours pourquoi on propose une offre.

import type { Offer } from '@/lib/offers/types';

/** Ce qu'on garde d'une offre likée ou passée : assez pour comparer, sans tout son texte. */
export interface TasteItem {
  id: string;
  title: string;
  company: string | null;
  href: string;
  department: string | null;
  romeCode: string | null;
  companySize: Offer['companySize'];
  diplomaLevel: Offer['diplomaLevel'];
  perks: string[];
  at: string;
}

export interface Taste {
  words: Map<string, number>;
  departments: Map<string, number>;
  sectors: Map<string, number>;
  sizes: Map<string, number>;
  levels: Map<number, number>;
  perks: Map<string, number>;
  likes: TasteItem[];
  /** Les offres ouvertes et décodées : un signal plus faible qu'un like. */
  decoded: TasteItem[];
}

const STOP = new Set([
  'alternance', 'alternant', 'alternante', 'apprenti', 'apprentie', 'apprentissage', 'contrat', 'professionnalisation', 'stage',
  'stagiaire', 'poste', 'offre', 'charge', 'chargee', 'assistant', 'assistante', 'junior', 'pour', 'avec', 'dans', 'une', 'des',
]);

const strip = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function titleWords(title: string): string[] {
  return [...new Set(strip(title).split(/[^a-z0-9]+/).filter((w) => w.length >= 3 && !STOP.has(w) && !/^\d+$/.test(w)))];
}

/** Le secteur : la famille du code ROME (« M18 » pour l'informatique). */
const sector = (rome: string | null) => (rome ? rome.slice(0, 3) : null);

function bump<K>(m: Map<K, number>, k: K | null | undefined, by: number) {
  if (k === null || k === undefined) return;
  m.set(k, (m.get(k) ?? 0) + by);
}

export function buildTaste(likes: TasteItem[], passes: TasteItem[] = [], decoded: TasteItem[] = []): Taste {
  const liked = new Set(likes.map((l) => l.id));
  const seen = decoded.filter((d) => !liked.has(d.id));
  const t: Taste = { words: new Map(), departments: new Map(), sectors: new Map(), sizes: new Map(), levels: new Map(), perks: new Map(), likes, decoded: seen };
  const add = (it: TasteItem, w: number) => {
    titleWords(it.title).forEach((word) => bump(t.words, word, w));
    bump(t.departments, it.department, w);
    bump(t.sectors, sector(it.romeCode), w);
    bump(t.sizes, it.companySize, w);
    bump(t.levels, it.diplomaLevel, w);
    it.perks.forEach((p) => bump(t.perks, p, w * 0.5));
  };
  likes.forEach((it) => add(it, 1));
  // Ouvrir une offre dit qu'elle intrigue, pas qu'on la veut.
  seen.forEach((it) => add(it, 0.4));
  // Une offre passée compte moins qu'un like : on a pu la passer pour mille raisons.
  passes.forEach((it) => add(it, -0.35));
  return t;
}

export interface TasteMatch {
  score: number;
  /** La raison principale, en clair. */
  reason: string | null;
}

/** Note d'une offre selon les goûts : plus c'est haut, plus elle ressemble à ce que la personne aime. */
export function scoreOffer(o: Omit<TasteItem, 'at' | 'href'>, t: Taste): TasteMatch {
  if (t.likes.length === 0 && t.decoded.length === 0) return { score: 0, reason: null };
  let score = 0;
  let best: { w: number; reason: string } | null = null;
  const consider = (w: number, reason: string) => {
    score += w;
    if (w > 0 && (!best || w > best.w)) best = { w, reason };
  };

  const words = titleWords(o.title);
  const wordScore = words.reduce((s, w) => s + (t.words.get(w) ?? 0), 0);
  if (wordScore) {
    const twin = t.likes.find((l) => titleWords(l.title).some((w) => words.includes(w)));
    const seenTwin = twin ? null : t.decoded.find((l) => titleWords(l.title).some((w) => words.includes(w)));
    consider(
      wordScore * 2,
      twin ? `Comme « ${twin.title} » que tu as aimée` : seenTwin ? `Proche de « ${seenTwin.title} » que tu as décodée` : 'Proche de tes likes',
    );
  }
  const sec = sector(o.romeCode);
  if (sec && t.sectors.get(sec)) consider(t.sectors.get(sec)! * 1.5, 'Le secteur que tu likes');
  if (o.department && t.departments.get(o.department)) consider(t.departments.get(o.department)!, 'Dans le coin que tu préfères');
  if (o.companySize && t.sizes.get(o.companySize)) consider(t.sizes.get(o.companySize)! * 0.6, 'Le type d’entreprise que tu aimes');
  if (o.diplomaLevel && t.levels.get(o.diplomaLevel)) consider(t.levels.get(o.diplomaLevel)! * 0.4, 'Ton niveau');
  for (const p of o.perks) if (t.perks.get(p)) consider(t.perks.get(p)! * 0.8, `${p}, comme tu aimes`);

  return { score: Math.round(score * 10) / 10, reason: (best as { w: number; reason: string } | null)?.reason ?? null };
}

/** Le résumé d'une offre qu'on garde pour apprendre les goûts (sans son texte). */
export function tasteOf(
  offer: Pick<Offer, 'id' | 'title' | 'company' | 'department' | 'companySize' | 'diplomaLevel'> & Partial<Pick<Offer, 'romeCode'>>,
  href: string,
  perks: string[],
): Omit<TasteItem, 'at'> {
  return {
    id: offer.id,
    title: offer.title,
    company: offer.company,
    href,
    department: offer.department,
    romeCode: offer.romeCode ?? null,
    companySize: offer.companySize,
    diplomaLevel: offer.diplomaLevel,
    perks,
  };
}
