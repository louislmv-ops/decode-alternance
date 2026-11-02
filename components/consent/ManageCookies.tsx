'use client';

import { isAnalyticsConfigured, openConsent } from '@/lib/consent';

/** « Gérer les cookies » : rouvre le bandeau pour changer d'avis à tout moment. */
export function ManageCookies({ className = 'link' }: { className?: string }) {
  if (!isAnalyticsConfigured()) return null;
  return (
    <button type="button" className={className === 'link' ? 'link consent__manage' : className} onClick={openConsent}>
      Gérer les cookies
    </button>
  );
}
