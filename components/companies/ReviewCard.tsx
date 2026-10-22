'use client';

import { useState } from 'react';
import { HIRED_LABELS, type PublicReview } from '@/lib/companies/shared';
import { Score } from './Stars';

export function ReviewCard({ review: r }: { review: PublicReview }) {
  const [note, setNote] = useState<string | null>(null);
  return (
    <article className="e-review">
      <p className="e-review__head">
        <strong>{r.title}</strong>
        <Score value={r.overall} label="Note" />
      </p>
      <p className="c-post__meta">
        {r.jobTitle} · depuis {r.startYear} · {HIRED_LABELS[r.hired]}
        {r.verified ? ' · e-mail pro vérifié' : ''}
      </p>
      <p className="e-review__part">
        <span>Points forts</span>
        {r.pros}
      </p>
      <p className="e-review__part">
        <span>Points faibles</span>
        {r.cons}
      </p>
      {note ? (
        <p className="c-note">{note}</p>
      ) : (
        <button
          type="button"
          className="e-review__report"
          onClick={async () => {
            const res = await fetch(`/api/entreprises/avis/${r.id}/signaler`, { method: 'POST' });
            const data = (await res.json().catch(() => ({}))) as { error?: string };
            setNote(res.ok ? 'Signalé. Merci, on va le relire.' : (data.error ?? 'Signalement impossible.'));
          }}
        >
          Signaler
        </button>
      )}
    </article>
  );
}
