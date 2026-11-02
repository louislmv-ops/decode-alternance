// Le choix de la personne sur la mesure d'audience, gardé six mois dans un cookie (recommandation de la CNIL),
// puis redemandé. Tant qu'il n'y a pas de « oui », aucun outil de mesure n'est chargé.

export type Consent = 'oui' | 'non';

export const CONSENT_COOKIE = 'decode_mesure';
const SIX_MONTHS = 60 * 60 * 24 * 182;

/** Ouvre le bandeau pour changer d'avis (« Gérer les cookies »). */
export const CONSENT_OPEN_EVENT = 'decode:consent-open';
/** Le choix vient de changer. */
export const CONSENT_CHANGE_EVENT = 'decode:consent';

/** La mesure d'audience est-elle branchée sur ce site ? Sans clé, ni bandeau ni outil. */
export function isAnalyticsConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY);
}

export function readConsent(cookie: string = typeof document === 'undefined' ? '' : document.cookie): Consent | null {
  const value = cookie
    .split('; ')
    .find((c) => c.startsWith(`${CONSENT_COOKIE}=`))
    ?.slice(CONSENT_COOKIE.length + 1);
  return value === 'oui' || value === 'non' ? value : null;
}

export function writeConsent(value: Consent) {
  const secure = location.protocol === 'https:' ? '; secure' : '';
  document.cookie = `${CONSENT_COOKIE}=${value}; path=/; max-age=${SIX_MONTHS}; samesite=lax${secure}`;
  window.dispatchEvent(new CustomEvent<Consent>(CONSENT_CHANGE_EVENT, { detail: value }));
}

export function openConsent() {
  window.dispatchEvent(new Event(CONSENT_OPEN_EVENT));
}
