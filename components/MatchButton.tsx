'use client';

// Le bouton qui ouvre le questionnaire, à part du questionnaire lui-même : celui-ci n'est chargé
// qu'après l'affichage de la page (LazyGlobals), et ce petit fichier suffit aux pages.

export const OPEN_EVENT = 'decode:match';

/** Ouverture demandée avant que le questionnaire soit chargé : il s'ouvrira dès son arrivée. */
export const PENDING_KEY = '__decodeMatchPending';

/** Ouvre le questionnaire depuis n'importe quel bouton. */
export function openMatcher() {
  (window as unknown as Record<string, boolean>)[PENDING_KEY] = true;
  window.dispatchEvent(new Event(OPEN_EVENT));
}

export function MatchButton({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <button type="button" className={className} onClick={openMatcher}>
      {children}
    </button>
  );
}
