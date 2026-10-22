'use client';

import Link from 'next/link';
import { useTracker } from '@/components/useTracker';

/** Pas d'offre en ligne ne veut pas dire pas de place : une candidature spontanée, bien adressée. */
export function SpontaneousCta({ name }: { name: string }) {
  const { add, apps } = useTracker();
  const already = apps.some((a) => a.channel === 'spontanee' && a.company.toLowerCase() === name.toLowerCase());
  return (
    <section className="e-block e-spont" aria-labelledby="spontanee">
      <h2 id="spontanee">Candidature spontanée</h2>
      <p className="c-note">Beaucoup d’alternances ne sont jamais publiées. Écris directement à la bonne équipe.</p>
      <div className="e-spont__actions">
        <Link href={`/equipe?entreprise=${encodeURIComponent(name)}`} className="btn btn--small">
          Trouver à qui écrire
        </Link>
        <button
          type="button"
          className="ui-btn ui-btn--small"
          disabled={already}
          onClick={() =>
            add({ company: name, title: 'Candidature spontanée', url: window.location.pathname, channel: 'spontanee', status: 'a-envoyer', sentAt: null, followedUpAt: null, notes: '' })
          }
        >
          {already ? 'Dans ton suivi' : 'Ajouter à mon suivi'}
        </button>
      </div>
    </section>
  );
}
