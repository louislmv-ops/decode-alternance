'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { DecodedOffer } from '@/lib/decode/schema';
import { DecodedView } from './DecodedView';

const MIN = 120;
const MAX = 12_000;

export function DecoderView({ aiEnabled, examples }: { aiEnabled: boolean; examples: { id: string; title: string; company: string }[] }) {
  const [text, setText] = useState('');
  const [state, setState] = useState<{ status: 'idle' | 'loading' } | { status: 'error'; message: string } | { status: 'done'; decoded: DecodedOffer }>({
    status: 'idle',
  });

  if (state.status === 'done') {
    return (
      <>
        <div className="back-row">
          <button type="button" className="ui-btn ui-btn--small" onClick={() => setState({ status: 'idle' })}>
            Décoder une autre offre
          </button>
        </div>
        <DecodedView decoded={state.decoded} offer={null} />
      </>
    );
  }

  const length = text.trim().length;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState({ status: 'loading' });
    try {
      const res = await fetch('/api/decode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = (await res.json()) as { decoded?: DecodedOffer; error?: string };
      if (!res.ok || !data.decoded) throw new Error(data.error ?? 'La traduction a échoué.');
      setState({ status: 'done', decoded: data.decoded });
      window.scrollTo({ top: 0 });
    } catch (error) {
      setState({ status: 'error', message: (error as Error).message });
    }
  }

  return (
    <div className="screen">
      <div className="title-row">
        <div>
          <h1>Décoder une offre</h1>
          <p className="title-row__sub">Colle une offre trouvée n’importe où.</p>
        </div>
      </div>

      <div className="decoder">
        <form className="panel decoder__form" onSubmit={submit}>
          <label htmlFor="offer-text" className="ui-label ui-label--field">
            Le texte de l’annonce
          </label>
          <textarea
            id="offer-text"
            className="ui-textarea"
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX))}
            placeholder="Colle ici tout le texte de l’offre : intitulé, missions, profil, rémunération…"
            rows={14}
            required
            minLength={MIN}
          />
          <div className="decoder__foot">
            <span className="num decoder__count">
              {length.toLocaleString('fr-FR')} / {MAX.toLocaleString('fr-FR')} caractères
            </span>
            <button type="submit" className="ui-btn ui-btn--primary" disabled={!aiEnabled || length < MIN || state.status === 'loading'}>
              {state.status === 'loading' ? 'Traduction en cours…' : 'Décoder'}
            </button>
          </div>
          {!aiEnabled && (
            <p className="notice">
              Bientôt disponible. En attendant, ouvre un exemple.
            </p>
          )}
          {state.status === 'loading' && (
            <p className="notice" role="status">
              Lecture de l’annonce… environ 20 secondes.
            </p>
          )}
          {state.status === 'error' && (
            <p className="notice notice--error" role="alert">
              {state.message}
            </p>
          )}
          <p className="panel__note">Traduit par une IA, rien n’est gardé.</p>
        </form>

        <section className="panel decoder__examples" aria-labelledby="examples-title">
          <div className="panel__head decoder__examples-head">
            <h2 id="examples-title">Essaie avec un exemple</h2>
            <span className="panel__meta">Offres fictives</span>
          </div>
          <ul className="example-list" role="list">
            {examples.map((ex) => (
              <li key={ex.id}>
                <Link href={`/offres/${encodeURIComponent(ex.id)}`}>
                  <span className="example-list__title">{ex.title}</span>
                  <span className="example-list__company">{ex.company}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
