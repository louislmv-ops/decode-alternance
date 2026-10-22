'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { BackLink } from '@/components/BackLink';
import type { Post } from '@/lib/community/shared';
import { call, Composer, PostCard, type PublicMember } from './ui';

export function ThreadView({ id }: { id: string }) {
  const [data, setData] = useState<{ post: Post; replies: Post[] } | null | undefined>(undefined);
  const [member, setMember] = useState<PublicMember | null>(null);

  const load = useCallback(() => call<{ post: Post; replies: Post[] }>(`/api/communaute/${id}`).then(setData).catch(() => setData(null)), [id]);

  useEffect(() => {
    load();
    call<{ member: PublicMember | null }>('/api/communaute/moi').then((d) => setMember(d.member)).catch(() => {});
  }, [load]);

  return (
    <div className="screen c-screen">
      <div className="back-row">
        <BackLink fallback="/communaute" label="La commu" />
      </div>
      <div className="c-main">
        {data === undefined ? (
          <p className="c-empty">Chargement…</p>
        ) : data === null ? (
          <p className="c-empty">Ce message n’existe plus.</p>
        ) : (
          <>
            <PostCard post={data.post} link={false} onChange={(p) => (p ? setData({ ...data, post: p }) : setData(null))} />
            {member ? (
              <Composer parentId={data.post.id} placeholder="Ta réponse" onPosted={load} />
            ) : (
              <p className="c-cta">
                <Link href="/compte">Connecte-toi</Link> pour répondre.
              </p>
            )}
            <div className="c-feed c-feed--replies">
              {data.replies.map((r) => (
                <PostCard
                  key={r.id}
                  post={r}
                  onChange={(p) => setData({ ...data, replies: data.replies.flatMap((x) => (x.id === r.id ? (p ? [p] : []) : [x])) })}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
