'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { Mascotte } from '@/components/Mascotte';

/** La page d'erreur : ce qui s'est passé, réessayer, ou repartir. La référence aide à retrouver l'erreur dans les journaux. */
export function ErrorState({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  const digest = error instanceof Error && 'digest' in error ? String((error as Error & { digest?: string }).digest ?? '') : '';
  return (
    <main className="prose-page lost">
      <Mascotte pose="surpris" size={160} className="lost__mascotte" eager />
      <h1>Oups, ça a planté</h1>
      <p>Une erreur de notre côté. Réessaie : souvent, ça passe la deuxième fois.</p>
      <p className="lost__links">
        <button type="button" className="btn" onClick={() => retry()}>
          Réessayer
        </button>
        <Link className="link" href="/">
          Retour à l’accueil
        </Link>
      </p>
      {digest && <p className="lost__ref">Référence de l’erreur : {digest}</p>}
    </main>
  );
}
