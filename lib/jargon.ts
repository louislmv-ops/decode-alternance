// Bullshit Bingo : les formules toutes faites des offres, repérées dans le texte et traduites.
// Deux sources : ce dictionnaire, qui marche sans IA et sur toutes les offres, et la liste « jargon »
// que l'IA renvoie avec chaque traduction (lib/decode/schema.ts), propre à l'annonce.
// Les traductions sont des lectures courantes de ces formules, pas un avis sur une entreprise :
// elles disent ce que ça peut cacher et quoi demander.

export interface Jargon {
  id: string;
  /** Le nom de la case, court. */
  label: string;
  /** Sur le texte plié (minuscules, sans accents, ponctuation en espaces), entre limites de mots. */
  pattern: string;
  traduction: string;
}

export const JARGON: Jargon[] = [
  {
    id: 'dynamique',
    label: 'Environnement dynamique',
    pattern: '(environnement|equipe|entreprise|structure|contexte|cadre) (tres |particulierement )?dynamique',
    traduction: 'Ça bouge vite et tout le monde est occupé. Demande comment se passent les rushs.',
  },
  {
    id: 'polyvalent',
    label: 'Polyvalent(e)',
    pattern: 'polyvalents?|polyvalentes?|polyvalence',
    traduction: 'Tu feras un peu de tout, y compris ce qui n’est pas écrit. Demande quelle est ta mission principale.',
  },
  {
    id: 'autonome',
    label: 'Autonome',
    pattern: 'autonomes?|autonomie',
    traduction: 'On te laissera souvent seul ou seule. Demande qui est ton tuteur et à quelle fréquence tu le vois.',
  },
  {
    id: 'proposition',
    label: 'Force de proposition',
    pattern: 'force de propositions?',
    traduction: 'On attend tes idées, pas seulement que tu exécutes. Prépare-en une pour l’entretien.',
  },
  {
    id: 'pression',
    label: 'Sous pression',
    pattern: '(travailler|travail|capacite a travailler|aisance) sous pression|gestion du stress|resistance au stress|resister au stress',
    traduction: 'Les délais sont serrés. Demande à quelle fréquence, et si les heures en plus sont payées ou récupérées.',
  },
  {
    id: 'startup',
    label: 'Esprit start-up',
    pattern: '(esprit|ambiance|mode|culture) start ?up',
    traduction: 'Peu de règles, beaucoup de liberté, parfois des horaires élastiques.',
  },
  {
    id: 'salaire',
    label: 'Salaire selon profil',
    pattern: '(remuneration|salaire) (attractive?|motivante?|selon profil|a negocier|selon experience)|selon (profil|experience)',
    traduction: 'Le montant n’est pas écrit. Ton minimum légal, lui, l’est : demande le chiffre dès le premier échange.',
  },
  {
    id: 'equipe',
    label: 'Esprit d’équipe',
    pattern: 'esprit d equipe|team player|travail en equipe',
    traduction: 'Tu ne travailleras pas seul dans ton coin. Plutôt une bonne nouvelle.',
  },
  {
    id: 'rythme',
    label: 'Rythme soutenu',
    pattern: 'rythme soutenu|cadence soutenue|fast paced|forte charge de travail',
    traduction: 'Ça va vite, tous les jours. Demande à quoi ressemble une semaine chargée.',
  },
  {
    id: 'rigueur',
    label: 'Rigoureux',
    pattern: 'rigoureux|rigoureuse|rigueur',
    traduction: 'Les erreurs se voient vite ici. Relis-toi deux fois.',
  },
  {
    id: 'famille',
    label: 'Comme une famille',
    pattern: 'comme une famille|esprit (de )?famille|ambiance familiale',
    traduction: 'Ambiance proche. Vérifie que les limites entre pro et perso restent claires.',
  },
  {
    id: 'horaires',
    label: 'Horaires flexibles',
    pattern: 'flexibilite (horaire|des horaires)|disponibilite (horaire|le soir|le week end)|horaires? flexibles?',
    traduction: 'Les horaires peuvent bouger. Demande qui décide : toi ou l’entreprise.',
  },
  {
    id: 'challenge',
    label: 'Goût du challenge',
    pattern: 'gout (du|des) (challenges?|defis?)|aimer les (challenges|defis)|challengeant',
    traduction: 'Objectifs ambitieux, souvent chiffrés. Demande comment ils sont fixés.',
  },
  {
    id: 'croissance',
    label: 'Forte croissance',
    pattern: '(forte|pleine) croissance|hypercroissance|scale ?up',
    traduction: 'L’équipe grandit vite : les rôles et les chefs peuvent changer en cours d’année.',
  },
  {
    id: 'tremplin',
    label: 'Véritable tremplin',
    pattern: '(veritable|vrai|reel) tremplin|belle opportunite|opportunite unique',
    traduction: 'Promesse classique. Demande ce que sont devenus les derniers alternants.',
  },
  {
    id: 'proactif',
    label: 'Proactif',
    pattern: 'proactifs?|proactives?|pro actif|ownership|esprit d initiative',
    traduction: 'N’attends pas qu’on te donne du travail : propose.',
  },
  {
    id: 'relationnel',
    label: 'Excellent relationnel',
    pattern: '(excellent|bon|tres bon) relationnel|aisance relationnelle|sens du relationnel',
    traduction: 'Tu parleras à beaucoup de monde, souvent à l’oral.',
  },
  {
    id: 'multitache',
    label: 'Multitâche',
    pattern: 'multi ?taches?|gerer plusieurs (projets|sujets|dossiers) (en parallele|a la fois|simultanement)',
    traduction: 'Plusieurs sujets en même temps. Demande lequel compte le plus.',
  },
  {
    id: 'passion',
    label: 'Passionné(e)',
    pattern: 'passionnes?|passionnees?',
    traduction: 'On veut de l’enthousiasme. Pas une raison de travailler plus que ton contrat.',
  },
  {
    id: 'variees',
    label: 'Missions variées',
    pattern: '(missions?|taches) variees',
    traduction: 'Le poste n’est peut-être pas encore très défini. Demande une semaine type.',
  },
  {
    id: 'agile',
    label: 'Agile',
    pattern: '(methodes?|methodologie|mode) agiles?|agilite',
    traduction: 'Des réunions courtes et fréquentes, et des priorités qui changent souvent.',
  },
  {
    id: 'experience',
    label: 'Expérience exigée',
    pattern: '(premiere|1re|1ere) experience (requise|exigee|indispensable|significative|obligatoire)',
    traduction: 'Pour une alternance, c’est souvent négociable. Postule quand même.',
  },
];

/** Les neuf cases de la grille, de gauche à droite et de haut en bas. La case du milieu est la plus fréquente. */
export const BINGO_CELLS = ['dynamique', 'polyvalent', 'autonome', 'proposition', 'equipe', 'pression', 'startup', 'salaire', 'rythme'];

/** Minuscules, sans accents, ponctuation en espaces, une lettre pour une lettre : les positions restent celles du texte. */
export function fold(text: string): string {
  let out = '';
  for (const ch of text) {
    const base = ch.normalize('NFD')[0]!.toLowerCase();
    const kept = /[a-z0-9]/.test(base) ? base : ' ';
    // Un caractère sur deux unités (emoji) garde ses deux places.
    out += kept.padEnd(ch.length, ' ');
  }
  return out;
}

export interface Hit {
  start: number;
  end: number;
  /** Le passage tel qu'écrit dans l'annonce. */
  text: string;
  traduction: string;
  /** L'entrée du dictionnaire, ou null pour une expression repérée par l'IA. */
  id: string | null;
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Une expression recopiée par l'IA, cherchée dans le texte sans tenir compte des accents ni de la ponctuation. */
function aiPattern(expression: string): string | null {
  const words = fold(expression).split(' ').filter(Boolean);
  return words.length ? words.map(escape).join(' +') : null;
}

/**
 * Les formules repérées dans le texte, dans l'ordre, sans chevauchement (la plus longue gagne).
 * Les expressions de l'IA passent d'abord : elles sont propres à l'annonce.
 */
export function findJargon(text: string, ai: { expression: string; traduction: string }[] = []): Hit[] {
  const folded = fold(text);
  const found: Hit[] = [];
  const scan = (pattern: string, traduction: string, id: string | null) => {
    const re = new RegExp(`(?<![a-z0-9])(?:${pattern})(?![a-z0-9])`, 'g');
    for (const m of folded.matchAll(re)) {
      const start = m.index;
      const end = start + m[0].length;
      found.push({ start, end, text: text.slice(start, end), traduction, id });
    }
  };
  for (const a of ai) {
    const pattern = aiPattern(a.expression);
    if (pattern) scan(pattern, a.traduction, null);
  }
  // Dans le texte plié, une ponctuation laisse plusieurs espaces : « start ?up » devient « start *up », un espace « + ».
  for (const j of JARGON) scan(j.pattern.replace(/ \?/g, '\0').replace(/ /g, ' +').replace(/\0/g, ' *'), j.traduction, j.id);
  // Sans chevauchement : l'IA d'abord, puis la plus longue, puis la première.
  const sorted = [...found].sort((a, b) => Number(a.id !== null) - Number(b.id !== null) || b.end - b.start - (a.end - a.start) || a.start - b.start);
  const kept: Hit[] = [];
  for (const h of sorted) if (!kept.some((k) => h.start < k.end && k.start < h.end)) kept.push(h);
  // Une expression de l'IA qui recouvre une formule du dictionnaire coche aussi sa case dans la grille.
  const withIds = kept.map((h) => (h.id !== null ? h : { ...h, id: found.find((f) => f.id !== null && f.start < h.end && h.start < f.end)?.id ?? null }));
  return withIds.sort((a, b) => a.start - b.start);
}

/** Une formule par ligne dans la liste : la première fois qu'elle apparaît. */
export function uniqueHits(hits: Hit[]): Hit[] {
  const seen = new Set<string>();
  return hits.filter((h) => {
    const key = h.id ?? fold(h.text).trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

/** La grille : les cases cochées par l'annonce, et le nombre de lignes complètes (une suffit pour « Bingo »). */
export function bingo(hits: Hit[]): { cells: { id: string; label: string; found: boolean }[]; lines: number } {
  const ids = new Set(hits.map((h) => h.id));
  const cells = BINGO_CELLS.map((id) => ({ id, label: JARGON.find((j) => j.id === id)!.label, found: ids.has(id) }));
  const lines = LINES.filter((line) => line.every((i) => cells[i]!.found)).length;
  return { cells, lines };
}
