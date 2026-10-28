// Les informations de l'éditeur, lues dans les variables d'environnement, jamais écrites dans le code.
// Une variable absente ne casse pas le build : la page affiche un emplacement à compléter et un
// avertissement part dans les journaux (une fois par variable et par processus).

const warned = new Set<string>();

function required(name: string, value: string | undefined): string | null {
  const v = value?.trim();
  if (v) return v;
  if (!warned.has(name)) {
    warned.add(name);
    console.warn(`[mentions légales] La variable ${name} n’est pas renseignée : la page affiche un emplacement à compléter.`);
  }
  return null;
}

/** Adresse de l'éditeur (une domiciliation, pas l'adresse personnelle). */
export function legalAddress(): string | null {
  return required('LEGAL_ADDRESS', process.env.LEGAL_ADDRESS);
}

/** Adresse e-mail de contact. Les anciennes variables restent lues tant qu'elles existent dans Vercel. */
export function contactEmail(): string | null {
  return required('CONTACT_EMAIL', process.env.CONTACT_EMAIL || process.env.LEGAL_CONTACT || process.env.NEXT_PUBLIC_CONTACT_EMAIL);
}

export function legalEditor(): string | null {
  return required('LEGAL_EDITOR', process.env.LEGAL_EDITOR);
}

export function legalSiren(): string | null {
  return required('LEGAL_SIREN', process.env.LEGAL_SIREN);
}

/** Prestataire de la base de données, tel qu'il doit apparaître (ex. « Supabase, région Francfort »). */
export function databaseHost(): string | null {
  return process.env.LEGAL_DATABASE_HOST?.trim() || null;
}

const FREE_AI_NAMES: Record<string, string> = { gemini: 'Google', mistral: 'Mistral AI', groq: 'Groq' };

/**
 * Le fournisseur d'IA réellement branché pour les traductions et l'assistant : Anthropic si sa clé est là,
 * sinon l'IA à palier gratuit choisie. `freeTier` : ce fournisseur peut se servir des textes pour ses modèles.
 */
export function aiProvider(): { name: string; freeTier: boolean } | null {
  if (process.env.ANTHROPIC_API_KEY) return { name: 'Anthropic', freeTier: false };
  if (!process.env.AI_API_KEY) return null;
  const name = FREE_AI_NAMES[(process.env.AI_PROVIDER || 'gemini').toLowerCase()];
  return name ? { name, freeTier: true } : null;
}
