'use client';

import { useEffect } from 'react';
import { rememberEntryPage, startAnalytics, stopAnalytics, track } from '@/lib/analytics';
import { CONSENT_CHANGE_EVENT, readConsent, type Consent } from '@/lib/consent';

/**
 * Branche la mesure selon le choix du bandeau, et compte les clics sur « Postuler » : tout lien marqué
 * data-track="apply_clicked" envoie l'événement avec ses data-* (offre, source, endroit de la page).
 */
export function Analytics() {
  useEffect(() => {
    rememberEntryPage(location.pathname);
    if (readConsent() === 'oui') void startAnalytics();
    const onChange = (e: Event) => {
      if ((e as CustomEvent<Consent>).detail === 'oui') void startAnalytics();
      else stopAnalytics();
    };
    const onClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-track="apply_clicked"]');
      if (!link) return;
      track('apply_clicked', { offer_id: link.dataset.offerId ?? null, source: link.dataset.source ?? null, placement: link.dataset.placement ?? null });
    };
    window.addEventListener(CONSENT_CHANGE_EVENT, onChange);
    document.addEventListener('click', onClick);
    return () => {
      window.removeEventListener(CONSENT_CHANGE_EVENT, onChange);
      document.removeEventListener('click', onClick);
    };
  }, []);
  return null;
}
