// Le swipe apprend ce que la personne ne veut pas voir : trois offres d'une même catégorie passées
// d'affilée, et la catégorie est masquée pour la suite (on peut la rétablir d'un geste).
// Gardé dans le navigateur, comme les likes.

export const SWIPE_KEY = 'decode.swipe.v1';

/** Au troisième refus d'affilée dans une catégorie, elle est masquée. */
export const HIDE_AFTER = 3;

export interface SwipeMemory {
  /** Refus d'affilée, par catégorie. */
  streaks: Record<string, number>;
  /** Catégories masquées, avec leur nom affiché. */
  hidden: Record<string, string>;
}

export const EMPTY_MEMORY: SwipeMemory = { streaks: {}, hidden: {} };

function without<T>(record: Record<string, T>, key: string): Record<string, T> {
  return Object.fromEntries(Object.entries(record).filter(([k]) => k !== key));
}

export interface Category {
  key: string;
  label: string;
}

/** Ce que change une décision : le compteur de la catégorie, et peut-être son masquage. */
export function afterDecision(memory: SwipeMemory, category: Category | null, dir: 'left' | 'right'): { memory: SwipeMemory; hid: Category | null } {
  if (!category) return { memory, hid: null };
  const count = dir === 'left' ? (memory.streaks[category.key] ?? 0) + 1 : 0;
  if (count >= HIDE_AFTER) {
    return { memory: { streaks: without(memory.streaks, category.key), hidden: { ...memory.hidden, [category.key]: category.label } }, hid: category };
  }
  return { memory: { ...memory, streaks: { ...memory.streaks, [category.key]: count } }, hid: null };
}

export function unhide(memory: SwipeMemory, key: string): SwipeMemory {
  return { ...memory, hidden: without(memory.hidden, key) };
}

/** Relit la mémoire gardée, en ignorant ce qui n'a pas la bonne forme. */
export function parseMemory(raw: string | null): SwipeMemory {
  try {
    const v = raw ? (JSON.parse(raw) as Partial<SwipeMemory>) : {};
    const streaks = Object.fromEntries(Object.entries(v.streaks ?? {}).filter(([, n]) => typeof n === 'number' && n > 0 && n < HIDE_AFTER));
    const hidden = Object.fromEntries(Object.entries(v.hidden ?? {}).filter(([, l]) => typeof l === 'string'));
    return { streaks, hidden };
  } catch {
    return EMPTY_MEMORY;
  }
}
