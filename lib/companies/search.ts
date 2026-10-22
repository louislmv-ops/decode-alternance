// L'annuaire officiel des entreprises (recherche-entreprises.api.gouv.fr) : gratuit, sans clé.
// Chaque page entreprise est identifiée par son SIREN, jamais par un nom tapé à la main :
// pas de doublons, pas d'entreprise inventée.

export interface CompanyRef {
  siren: string;
  name: string;
  city: string;
  postalCode: string;
  /** Code de tranche d'effectif INSEE, null s'il n'est pas connu. */
  sizeCode: string | null;
}

interface ApiResult {
  siren: string;
  nom_complet?: string;
  nom_raison_sociale?: string;
  etat_administratif?: string;
  tranche_effectif_salarie?: string | null;
  siege?: { libelle_commune?: string; code_postal?: string };
}

const base = () => process.env.ENTREPRISES_API_URL || 'https://recherche-entreprises.api.gouv.fr';

/** « DECATHLON FRANCE (DECATHLON) » devient « Decathlon France (Decathlon) ». */
export function tidyName(raw: string): string {
  if (raw !== raw.toUpperCase()) return raw.trim();
  return raw
    .toLowerCase()
    .replace(/(^|[\s(\-'’])(\p{L})/gu, (_, sep: string, ch: string) => sep + ch.toUpperCase())
    .replace(/\b(Sas|Sa|Sarl|Sasu|Eurl|Snc|Sci)\b/g, (m) => m.toUpperCase())
    // Villeneuve-d’Ascq, Boulogne-sur-Mer : les petits mots restent en minuscules, sauf en tête.
    .replace(/(?<=[-\s])(D’|L’|D'|L'|Sur|Sous|En|Les|La|Le|De|Du|Des|Et)(?=[-\s\p{L}])/gu, (m) => m.toLowerCase())
    .trim();
}

function toRef(r: ApiResult): CompanyRef {
  return {
    siren: r.siren,
    name: tidyName(r.nom_complet || r.nom_raison_sociale || r.siren),
    city: r.siege?.libelle_commune ? tidyName(r.siege.libelle_commune) : '',
    postalCode: r.siege?.code_postal ?? '',
    sizeCode: r.tranche_effectif_salarie ?? null,
  };
}

export async function searchCompanies(q: string): Promise<CompanyRef[]> {
  const query = q.trim().slice(0, 80);
  if (query.length < 2) return [];
  const url = `${base()}/search?${new URLSearchParams({ q: query, per_page: '10', etat_administratif: 'A' })}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(6000), next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`annuaire ${res.status}`);
  const data = (await res.json()) as { results?: ApiResult[] };
  return (data.results ?? []).filter((r) => /^\d{9}$/.test(r.siren)).map(toRef);
}

/** Retrouve une entreprise par son SIREN dans l'annuaire officiel. */
export async function companyBySiren(siren: string): Promise<CompanyRef | null> {
  if (!/^\d{9}$/.test(siren)) return null;
  const results = await searchCompanies(siren);
  return results.find((r) => r.siren === siren) ?? null;
}
