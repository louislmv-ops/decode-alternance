// La mesure d'audience (PostHog), seulement après un « oui » au bandeau : avant, le script n'est même pas
// téléchargé. Un « non », même après coup, coupe l'envoi et efface ce que PostHog avait gardé dans le navigateur.

import type { PostHog } from 'posthog-js';
import { readConsent } from './consent';

/** Les événements suivis, et rien d'autre (pas d'autocapture, pas d'enregistrement de session). */
export type AnalyticsEvent = 'search_performed' | 'offer_viewed' | 'apply_clicked' | 'filter_used';
type Props = Record<string, string | number | boolean | null | string[]>;

let client: PostHog | null = null;
let loading: Promise<PostHog | null> | null = null;
/** La page par laquelle la personne est arrivée, gardée en mémoire le temps de l'onglet, jamais stockée. */
let entryPage: string | null = null;

export function rememberEntryPage(path: string) {
  entryPage ??= path;
}

export function startAnalytics(): Promise<PostHog | null> {
  const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
  if (!token || !host || readConsent() !== 'oui') return Promise.resolve(null);
  if (client) {
    // Un « oui » après un « non » dans la même visite : on relance l'envoi, une seule fois.
    if (client.has_opted_out_capturing()) client.opt_in_capturing();
    return Promise.resolve(client);
  }
  loading ??= import('posthog-js').then(({ default: posthog }) => {
    posthog.init(token, {
      api_host: host,
      defaults: '2026-08-30',
      autocapture: false,
      disable_session_recording: true,
      capture_dead_clicks: false,
      person_profiles: 'identified_only',
      // Un refus coupe aussi le stockage : plus rien n'est écrit dans le navigateur.
      opt_out_persistence_by_default: true,
    });
    if (entryPage) posthog.register({ entry_page: entryPage });
    client = posthog;
    return posthog;
  });
  return loading;
}

export function stopAnalytics() {
  // Pas de reset() : il redemanderait la configuration à PostHog au moment même du refus.
  client?.opt_out_capturing();
  // Les cookies et le stockage que PostHog a pu poser (ph_…), même par une visite précédente. Ses cookies
  // peuvent porter le domaine du site : on les efface sous chaque forme possible.
  const domains = ['', `; domain=${location.hostname}`, `; domain=.${location.hostname.replace(/^www\./, '')}`];
  for (const c of document.cookie.split('; ')) {
    const name = c.split('=')[0] ?? '';
    if (name.startsWith('ph_')) for (const d of domains) document.cookie = `${name}=; path=/; max-age=0${d}`;
  }
  try {
    for (const key of Object.keys(localStorage)) if (key.startsWith('ph_')) localStorage.removeItem(key);
  } catch {
    // Stockage indisponible (navigation privée) : rien à effacer.
  }
}

/** Envoie un événement si la personne a accepté ; sinon, ne fait rien. */
export function track(event: AnalyticsEvent, props: Props = {}) {
  if (readConsent() !== 'oui') return;
  void startAnalytics().then((ph) => ph?.capture(event, props));
}
