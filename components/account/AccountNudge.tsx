'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const HIDE_KEY = 'decode-nudge-compte';

/** Un rappel discret : le compte est facultatif, mais garde le suivi et les likes sur tous les appareils. */
export function AccountNudge({ what = 'ton suivi et tes likes' }: { what?: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    let hidden = false;
    try {
      hidden = window.localStorage.getItem(HIDE_KEY) === '1';
    } catch {
      // Stockage bloqué : on montre le rappel.
    }
    const signedIn = document.cookie.split('; ').includes('decode_connecte=1');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShow(!hidden && !signedIn);
  }, []);
  if (!show) return null;
  return (
    <aside className="nudge" data-needs="comptes" aria-label="Compte">
      <p>
        <strong>Garde {what} partout.</strong> Compte gratuit, facultatif, sans mot de passe.
      </p>
      <div className="nudge__actions">
        <Link href="/compte" className="ui-btn ui-btn--small ui-btn--primary">
          Créer mon compte
        </Link>
        <button
          type="button"
          className="nudge__close"
          aria-label="Masquer"
          onClick={() => {
            setShow(false);
            try {
              window.localStorage.setItem(HIDE_KEY, '1');
            } catch {
              // Rien à garder.
            }
          }}
        >
          ×
        </button>
      </div>
    </aside>
  );
}
