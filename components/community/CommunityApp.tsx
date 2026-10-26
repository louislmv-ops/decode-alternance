'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { KIND_LABELS, KINDS, type Post, type PostKind } from '@/lib/community/shared';
import { call, Composer, JoinForm, MemberRow, PostCard, type PublicMember } from './ui';

interface Me {
  signedIn: boolean;
  member: PublicMember | null;
  admin: boolean;
}

export function CommunityApp({ open }: { open: boolean }) {
  const [me, setMe] = useState<Me | null>(null);
  const [scope, setScope] = useState<'tout' | 'abonnements'>('tout');
  const [kind, setKind] = useState<PostKind | null>(null);
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [more, setMore] = useState(false);
  const [suggested, setSuggested] = useState<PublicMember[]>([]);

  const fetchPage = useCallback(
    (before?: string) => {
      const params = new URLSearchParams({ fil: scope });
      if (kind) params.set('type', kind);
      if (before) params.set('avant', before);
      return call<{ posts: Post[] }>(`/api/communaute?${params}`).then((d) => d.posts);
    },
    [scope, kind],
  );

  const load = useCallback(
    (before?: string) =>
      fetchPage(before).then((page) => {
        setPosts((prev) => (before && prev ? [...prev, ...page] : page));
        setMore(page.length === 30);
      }),
    [fetchPage],
  );

  useEffect(() => {
    if (!open) return;
    call<Me>('/api/communaute/moi').then(setMe).catch(() => setMe({ signedIn: false, member: null, admin: false }));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let live = true;
    fetchPage()
      .then((page) => {
        if (!live) return;
        setPosts(page);
        setMore(page.length === 30);
      })
      .catch(() => live && setPosts([]));
    return () => {
      live = false;
    };
  }, [open, fetchPage]);

  useEffect(() => {
    if (!me?.member) return;
    call<{ members: PublicMember[] }>('/api/communaute/suggestions').then((d) => setSuggested(d.members)).catch(() => {});
  }, [me?.member]);

  if (!open) {
    return (
      <div className="screen c-screen">
        <div className="c-soon">
          <h1>La commu</h1>
          <p>Questions, témoignages, bons plans entre alternants. Ça ouvre très vite.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="screen c-screen">
      <div className="c-layout">
        <div className="c-main">
          <div className="c-top">
            <h1>La commu</h1>
            {me?.admin && (
              <Link href="/communaute/moderation" className="acct-link">
                Modération
              </Link>
            )}
          </div>

          {me?.member ? (
            <Composer placeholder="Une question, un retour d’expérience ?" onPosted={() => load()} />
          ) : me?.signedIn ? (
            <JoinForm onJoined={(m) => setMe({ ...me, member: m })} />
          ) : me ? (
            <div className="c-cta">
              <p>
                <strong>Pose tes questions, partage ton expérience.</strong>
              </p>
              <Link href="/compte" className="btn btn--small">
                Rejoindre
              </Link>
            </div>
          ) : null}

          <div className="c-tabs" role="tablist">
            <button type="button" role="tab" aria-selected={scope === 'tout'} onClick={() => setScope('tout')}>
              Tout
            </button>
            <button type="button" role="tab" aria-selected={scope === 'abonnements'} onClick={() => setScope('abonnements')} disabled={!me?.member}>
              Abonnements
            </button>
          </div>
          <div className="c-filters" role="group" aria-label="Filtrer">
            {KINDS.filter((k) => k !== 'libre').map((k) => (
              <button key={k} type="button" aria-pressed={kind === k} onClick={() => setKind(kind === k ? null : k)}>
                {KIND_LABELS[k]}s
              </button>
            ))}
          </div>

          {posts === null ? (
            <p className="c-empty">Chargement…</p>
          ) : posts.length === 0 ? (
            <p className="c-empty">{scope === 'abonnements' ? 'Suis des membres pour voir leurs messages ici.' : 'Rien encore. Lance la discussion.'}</p>
          ) : (
            <div className="c-feed">
              {posts.map((p) => (
                <PostCard key={p.id} post={p} onChange={(next) => setPosts((all) => (all ?? []).flatMap((x) => (x.id === p.id ? (next ? [next] : []) : [x])))} />
              ))}
            </div>
          )}
          {more && posts && (
            <button type="button" className="ui-btn c-more" onClick={() => load(posts.at(-1)?.createdAt)}>
              Voir plus
            </button>
          )}
        </div>

        {suggested.length > 0 && (
          <aside className="c-side" aria-label="Membres à suivre">
            <h2>À suivre</h2>
            <ul className="c-members" role="list">
              {suggested.map((m) => (
                <MemberRow key={m.handle} member={m} />
              ))}
            </ul>
          </aside>
        )}
      </div>
    </div>
  );
}
