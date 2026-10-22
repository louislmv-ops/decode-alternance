'use client';

import { useEffect, useState } from 'react';
import { BackLink } from '@/components/BackLink';
import { call } from './ui';

interface Pending {
  accountId: string;
  company: string;
  siret: string;
  website: string;
  contactName: string;
  role: string;
  email: string;
}

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
  const [pending, setPending] = useState<Pending[]>([]);
  const [campaigns, setCampaigns] = useState<{ id: string; title: string; company: string }[]>([]);
  const loadPending = () => call<{ pending: Pending[] }>('/api/recruteur/verification').then((d) => setPending(d.pending)).catch(() => {});

  const load = () =>
    call<{ reported: Reported[] }>('/api/communaute/moderation')
      .then((d) => setItems(d.reported))
      .catch((err: Error) => setError(err.message));

  useEffect(() => {
    call<{ reported: Reported[] }>('/api/communaute/moderation')
      .then((d) => setItems(d.reported))
      .catch((err: Error) => setError(err.message));
    call<{ pending: Pending[] }>('/api/recruteur/verification').then((d) => setPending(d.pending)).catch(() => {});
    call<{ campaigns: { id: string; title: string; company: string }[] }>('/api/campagnes').then((d) => setCampaigns(d.campaigns)).catch(() => {});
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
        {pending.length > 0 && <h2>Entreprises à vérifier</h2>}
        {pending.map((r) => (
          <article key={r.accountId} className="c-mod">
            <p className="c-post__text">
              <strong>{r.company}</strong> · SIRET{' '}
              <a className="link" href={`https://annuaire-entreprises.data.gouv.fr/etablissement/${r.siret}`} target="_blank" rel="noopener noreferrer">
                {r.siret}
              </a>
            </p>
            <p className="c-post__meta">
              {r.contactName}
              {r.role ? ` (${r.role})` : ''} · {r.email} {r.website && `· ${r.website}`}
            </p>
            <div className="c-mod__actions">
              <button
                type="button"
                className="ui-btn ui-btn--small"
                onClick={async () => {
                  await call('/api/recruteur/verification', 'POST', { accountId: r.accountId, verified: true });
                  await loadPending();
                }}
              >
                Vérifier
              </button>
            </div>
          </article>
        ))}
        {campaigns.length > 0 && <h2>Campagnes en ligne</h2>}
        {campaigns.map((c) => (
          <article key={c.id} className="c-mod">
            <p className="c-post__text">
              <strong>{c.company}</strong> · <a className="link" href={`/campagnes/${c.id}`}>{c.title}</a>
            </p>
            <div className="c-mod__actions">
              <button
                type="button"
                className="ui-btn ui-btn--small"
                onClick={async () => {
                  if (!window.confirm('Masquer cette campagne ?')) return;
                  await call(`/api/campagnes/${c.id}`, 'DELETE');
                  setCampaigns((all) => all.filter((x) => x.id !== c.id));
                }}
              >
                Masquer
              </button>
            </div>
          </article>
        ))}
        {(pending.length > 0 || campaigns.length > 0) && <h2>Signalements</h2>}
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
