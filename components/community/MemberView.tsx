'use client';

import { useEffect, useState } from 'react';
import { BackLink } from '@/components/BackLink';
import type { Post } from '@/lib/community/shared';
import { Avatar, call, PostCard, type PublicMember } from './ui';

export function MemberView({ handle }: { handle: string }) {
  const [data, setData] = useState<{ member: PublicMember; following: boolean; me: boolean } | null | undefined>(undefined);
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    call<{ member: PublicMember; following: boolean; me: boolean }>(`/api/communaute/membres/${encodeURIComponent(handle)}`)
      .then(setData)
      .catch(() => setData(null));
    call<{ posts: Post[] }>(`/api/communaute?membre=${encodeURIComponent(handle)}`)
      .then((d) => setPosts(d.posts))
      .catch(() => {});
  }, [handle]);

  if (data === undefined) return <div className="screen c-screen"><p className="c-empty">Chargement…</p></div>;
  if (data === null) return <div className="screen c-screen"><p className="c-empty">Ce membre n’existe pas.</p></div>;

  const m = data.member;
  return (
    <div className="screen c-screen">
      <div className="back-row">
        <BackLink fallback="/communaute" label="La commu" />
      </div>
      <div className="c-main">
        <header className="c-profile">
          <Avatar name={m.name} size={72} />
          <div className="c-profile__id">
            <h1>{m.name}</h1>
            <p className="c-post__meta">@{m.handle}</p>
          </div>
          {!data.me && (
            <button
              type="button"
              className={`c-follow c-follow--big${data.following ? ' is-on' : ''}`}
              onClick={async () => {
                const on = !data.following;
                setData({ ...data, following: on, member: { ...m, followers: m.followers + (on ? 1 : -1) } });
                await call(`/api/communaute/membres/${m.handle}/suivre`, 'POST', { on }).catch(() => setData(data));
              }}
            >
              {data.following ? 'Suivi' : 'Suivre'}
            </button>
          )}
        </header>
        {m.bio && <p className="c-profile__bio">{m.bio}</p>}
        <p className="c-profile__facts">{[m.domain, m.city, m.school].filter(Boolean).join(' · ')}</p>
        <p className="c-profile__counts num">
          <strong>{m.followers}</strong> abonnés · <strong>{m.following}</strong> abonnements · <strong>{m.posts}</strong> messages
        </p>
        <div className="c-feed">
          {posts.length === 0 ? <p className="c-empty">Pas encore de message.</p> : posts.map((p) => <PostCard key={p.id} post={p} />)}
        </div>
      </div>
    </div>
  );
}
