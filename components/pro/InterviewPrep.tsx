'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { Interview } from '@/lib/pro/interview-types';

/** Prépa entretien (Pro) : six questions probables, quoi répondre, quoi demander, quoi préparer. */
export function InterviewPrep({ offerId }: { offerId: string }) {
  const [state, setState] = useState<{ kind: 'idle' | 'busy' } | { kind: 'done'; interview: Interview } | { kind: 'error'; text: string; pro?: boolean; login?: boolean }>({
    kind: 'idle',
  });

  async function run() {
    setState({ kind: 'busy' });
    const res = await fetch('/api/pro/entretien', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ offerId }) });
    const data = (await res.json().catch(() => ({}))) as { interview?: Interview; error?: string };
    if (res.ok && data.interview) setState({ kind: 'done', interview: data.interview });
    else setState({ kind: 'error', text: data.error ?? 'La préparation a échoué.', pro: res.status === 402, login: res.status === 401 });
  }

  return (
    <section className="prep" aria-labelledby="prep-title">
      <div className="prep__head">
        <h2 id="prep-title">Prépa entretien</h2>
        <span className="prep__tag">Pro</span>
      </div>
      {state.kind === 'idle' && (
        <>
          <p className="c-note">Les questions qu’on te posera sur ce poste, et comment y répondre.</p>
          <button type="button" className="btn btn--small" onClick={run}>
            Préparer l’entretien
          </button>
        </>
      )}
      {state.kind === 'busy' && <p className="c-note">Préparation en cours, une vingtaine de secondes…</p>}
      {state.kind === 'error' && (
        <p className="c-note">
          {state.text}{' '}
          {state.pro && <Link href="/pro">Essayer Pro gratuitement</Link>}
          {state.login && <Link href="/compte">Se connecter</Link>}
        </p>
      )}
      {state.kind === 'done' && (
        <>
          <ol className="prep__list">
            {state.interview.questions.map((q) => (
              <li key={q.question}>
                <strong>{q.question}</strong>
                <span className="prep__why">{q.pourquoi}</span>
                <span>{q.commentRepondre}</span>
              </li>
            ))}
          </ol>
          <h3>À demander à la fin</h3>
          <ul className="bullets">
            {state.interview.aDemander.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
          <h3>À préparer avant</h3>
          <ul className="bullets">
            {state.interview.aPreparer.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
