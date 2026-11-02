'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CONSENT_OPEN_EVENT, readConsent, writeConsent, type Consent } from '@/lib/consent';

/**
 * Le bandeau de consentement. Refuser est aussi simple qu'accepter : deux boutons identiques, côte à côte,
 * et fermer sans choisir ne vaut pas accord. Rien ne bloque la page pendant qu'il est affiché.
 */
export function CookieBanner() {
  // Chargé seulement dans le navigateur (LazyGlobals, ssr: false) : le cookie se lit dès le premier rendu.
  const [open, setOpen] = useState(() => readConsent() === null);

  useEffect(() => {
    const reopen = () => setOpen(true);
    window.addEventListener(CONSENT_OPEN_EVENT, reopen);
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, reopen);
  }, []);

  if (!open) return null;
  const choose = (value: Consent) => {
    writeConsent(value);
    setOpen(false);
  };
  return (
    <section className="consent" role="region" aria-labelledby="consent-title">
      <p id="consent-title" className="consent__title">
        On peut mesurer ta visite ?
      </p>
      <p className="consent__text">
        Décode aimerait compter les recherches, les offres ouvertes et les clics sur « Postuler » avec PostHog (serveurs en Europe), pour
        savoir ce qui t’aide vraiment. Si tu refuses, rien n’est mesuré et le site marche pareil.{' '}
        <Link href="/confidentialite#cookies" className="link">
          En savoir plus
        </Link>
      </p>
      <div className="consent__actions">
        <button type="button" className="ui-btn consent__btn" onClick={() => choose('non')}>
          Refuser
        </button>
        <button type="button" className="ui-btn consent__btn" onClick={() => choose('oui')}>
          Accepter
        </button>
      </div>
    </section>
  );
}
