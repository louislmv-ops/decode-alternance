'use client';

import { useEffect, useState } from 'react';
import { BackLink } from '@/components/BackLink';
import { call } from './ui';

interface Reported {
  id: string;
  body: string;
  handle: string;
  reports: number;
  hidden: boolean;
  reasons: string[];
}

export function ModerationView() {
  const [items, setItems] = useState<Reported[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () =>
    call<{ reported: Reported[] }>('/api/communaute/moderation')
      .then((d) => setItems(d.reported))
      .catch((err: Error) => setError(err.message));

  useEffect(() => {
    call<{ reported: Reported[] }>('/api/communaute/moderation')
      .then((d) => setItems(d.reported))
      .catch((err: Error) => setError(err.message));
  }, []);

  async function act(body: unknown) {
    await call('/api/communaute/moderation', 'POST', body);
    await load();
  }

  return (
    <div className="screen c-screen">
      <div className="back-row">
        <BackLink fallback="/communaute" label="La commu" />
      </div>
      <div className="c-main">
        <h1 className="c-charte__title">Modération</h1>
        {error && <p className="c-note c-note--error">{error}</p>}
        {items?.length === 0 && <p className="c-empty">Aucun signalement.</p>}
        {items?.map((it) => (
          <article key={it.id} className="c-mod">
            <p className="c-post__meta">
              @{it.handle} · {it.reports} signalement{it.reports > 1 ? 's' : ''} {it.hidden ? '· masqué' : ''}
            </p>
            <p className="c-post__text">{it.body}</p>
            <div className="c-mod__actions">
              <button type="button" className="ui-btn ui-btn--small" onClick={() => act({ postId: it.id, action: 'garder' })}>
                Garder
              </button>
              <button type="button" className="ui-btn ui-btn--small" onClick={() => act({ postId: it.id, action: 'masquer' })}>
                Masquer
              </button>
              <button
                type="button"
                className="ui-btn ui-btn--small"
                onClick={() => window.confirm(`Exclure @${it.handle} ?`) && act({ ban: it.handle })}
              >
                Exclure l’auteur
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
