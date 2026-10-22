'use client';

import { useRouter } from 'next/navigation';

/** Retour en arrière : indispensable dans l'app installée, qui n'a pas de bouton « précédent ». */
export function BackLink({ fallback, label }: { fallback: string; label: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className="back-link"
      onClick={() => (window.history.length > 1 ? router.back() : router.push(fallback))}
    >
      ← {label}
    </button>
  );
}
