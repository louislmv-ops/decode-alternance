'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { CompanyRef } from '@/lib/companies/search';

export function CompanySearch({ initial = '' }: { initial?: string }) {
  const [q, setQ] = useState(initial);
  const [results, setResults] = useState<CompanyRef[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (q.trim().length < 2) return;
    let live = true;
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/entreprises/recherche?q=${encodeURIComponent(q)}`);
        const data = (await res.json()) as { results?: CompanyRef[]; error?: string };
        if (!live) return;
        setError(data.error ?? null);
        setResults(data.results ?? []);
      } catch {
        if (live) setError('Recherche impossible pour l’instant.');
      }
    }, 300);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [q]);

  const shown = q.trim().length >= 2 ? results : null;
  return (
    <div className="e-search">
      <input
        className="ui-input e-search__input"
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Nom de l’entreprise ou SIREN"
        aria-label="Chercher une entreprise"
      />
      {error && <p className="c-note c-note--error">{error}</p>}
      {shown && shown.length === 0 && !error && <p className="c-empty">Aucune entreprise trouvée.</p>}
      {shown && shown.length > 0 && (
        <ul className="e-results" role="list">
          {shown.map((c) => (
            <li key={c.siren}>
              <Link href={`/entreprises/${c.siren}`}>
                <strong>{c.name}</strong>
                <span>{[c.city, c.postalCode.slice(0, 2)].filter(Boolean).join(' · ')}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
