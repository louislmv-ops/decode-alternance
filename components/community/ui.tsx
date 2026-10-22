'use client';

import Link from 'next/link';
import { useState } from 'react';
import { KIND_LABELS, POST_MAX, type Member, type Post, type PostKind } from '@/lib/community/shared';

export type PublicMember = Omit<Member, 'accountId'> & { accountId?: string };

export async function call<T>(url: string, method = 'GET', body?: unknown): Promise<T> {
  const res = await fetch(url, { method, headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(data.error ?? 'Une erreur est survenue.');
  return data;
}

export function timeAgo(iso: string, now = Date.now()): string {
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (s < 60) return 'à l’instant';
  if (s < 3600) return `${Math.floor(s / 60)} min`;
  if (s < 86_400) return `${Math.floor(s / 3600)} h`;
  if (s < 7 * 86_400) return `${Math.floor(s / 86_400)} j`;
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  return (
    <span className="c-avatar" style={{ width: size, height: size, fontSize: size * 0.42 }} aria-hidden="true">
      {name.trim().charAt(0).toUpperCase() || '?'}
    </span>
  );
}

const Heart = ({ on }: { on: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 16 16" fill={on ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <path d="M8 13.5S2 10 2 6a3 3 0 0 1 6-1 3 3 0 0 1 6 1c0 4-6 7.5-6 7.5z" strokeLinejoin="round" />
  </svg>
);

const Bubble = () => (
  <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <path d="M2.5 3.5h11v7h-6l-3 2.5v-2.5h-2z" strokeLinejoin="round" />
  </svg>
);

export function PostCard({ post, onChange, link = true }: { post: Post; onChange?: (p: Post | null) => void; link?: boolean }) {
  const [menu, setMenu] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  async function like() {
    const on = !post.likedByMe;
    onChange?.({ ...post, likedByMe: on, likes: post.likes + (on ? 1 : -1) });
    try {
      await call(`/api/communaute/${post.id}/like`, 'POST', { on });
    } catch (err) {
      onChange?.(post);
      setNote((err as Error).message);
    }
  }

  return (
    <article className="c-post">
      <Link href={`/membres/${post.author.handle}`} className="c-post__avatar" aria-label={post.author.name}>
        <Avatar name={post.author.name} />
      </Link>
      <div className="c-post__body">
        <p className="c-post__head">
          <Link href={`/membres/${post.author.handle}`} className="c-post__name">
            {post.author.name}
          </Link>
          <span className="c-post__meta">
            @{post.author.handle}
            {post.author.domain ? ` · ${post.author.domain}` : ''} · {timeAgo(post.createdAt)}
          </span>
        </p>
        {!post.parentId && post.kind !== 'libre' && <span className={`c-kind c-kind--${post.kind}`}>{KIND_LABELS[post.kind]}</span>}
        {link && !post.parentId ? (
          <Link href={`/communaute/${post.id}`} className="c-post__text">
            {post.body}
          </Link>
        ) : (
          <p className="c-post__text">{post.body}</p>
        )}
        <div className="c-post__actions">
          <button type="button" className={`c-act${post.likedByMe ? ' is-on' : ''}`} onClick={like} aria-pressed={post.likedByMe} aria-label="J’aime">
            <Heart on={post.likedByMe} />
            <span className="num">{post.likes || ''}</span>
          </button>
          {!post.parentId && (
            <Link href={`/communaute/${post.id}`} className="c-act" aria-label="Répondre">
              <Bubble />
              <span className="num">{post.replies || ''}</span>
            </Link>
          )}
          <button type="button" className="c-act c-act--more" aria-expanded={menu} aria-label="Plus" onClick={() => setMenu((m) => !m)}>
            ···
          </button>
          {menu && (
            <span className="c-menu">
              {post.mine ? (
                <button
                  type="button"
                  onClick={async () => {
                    await call(`/api/communaute/${post.id}`, 'DELETE');
                    onChange?.(null);
                  }}
                >
                  Supprimer
                </button>
              ) : (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await call(`/api/communaute/${post.id}/signaler`, 'POST', { reason: '' });
                      setNote('Signalé. Merci.');
                    } catch (err) {
                      setNote((err as Error).message);
                    }
                    setMenu(false);
                  }}
                >
                  Signaler
                </button>
              )}
            </span>
          )}
        </div>
        {note && <p className="c-note">{note}</p>}
      </div>
    </article>
  );
}

const KIND_ORDER: PostKind[] = ['question', 'temoignage', 'astuce', 'libre'];

export function Composer({ parentId, placeholder, onPosted }: { parentId?: string; placeholder: string; onPosted: () => void }) {
  const [body, setBody] = useState('');
  const [kind, setKind] = useState<PostKind>('question');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const left = POST_MAX - body.length;

  return (
    <form
      className="c-composer"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        try {
          await call('/api/communaute', 'POST', { body, kind, parentId: parentId ?? null });
          setBody('');
          onPosted();
        } catch (err) {
          setError((err as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <textarea
        className="c-composer__input"
        placeholder={placeholder}
        value={body}
        maxLength={POST_MAX}
        rows={parentId ? 2 : 3}
        onChange={(e) => setBody(e.target.value)}
        aria-label={placeholder}
      />
      <div className="c-composer__foot">
        {!parentId && (
          <div className="c-kinds" role="group" aria-label="Type de message">
            {KIND_ORDER.map((k) => (
              <button key={k} type="button" aria-pressed={kind === k} onClick={() => setKind(k)}>
                {KIND_LABELS[k]}
              </button>
            ))}
          </div>
        )}
        <span className={`c-count num${left < 40 ? ' is-low' : ''}`}>{left}</span>
        <button type="submit" className="btn btn--small" disabled={busy || body.trim().length === 0}>
          {parentId ? 'Répondre' : 'Publier'}
        </button>
      </div>
      {error && (
        <p className="c-note c-note--error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}

/** Rejoindre : un pseudo, un nom, et la charte. */
export function JoinForm({ onJoined }: { onJoined: (m: PublicMember) => void }) {
  const [f, setF] = useState({ handle: '', name: '', domain: '', city: '', charte: false });
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="c-join"
      onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
        try {
          const { member } = await call<{ member: PublicMember }>('/api/communaute/moi', 'PUT', f);
          onJoined(member);
        } catch (err) {
          setError((err as Error).message);
        }
      }}
    >
      <h2 className="c-join__title">Rejoins la commu</h2>
      <div className="c-join__grid">
        <input className="ui-input" placeholder="Pseudo (ex. ines_mkt)" value={f.handle} onChange={(e) => setF({ ...f, handle: e.target.value })} required />
        <input className="ui-input" placeholder="Prénom ou nom affiché" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required />
        <input className="ui-input" placeholder="Domaine (ex. marketing)" value={f.domain} onChange={(e) => setF({ ...f, domain: e.target.value })} />
        <input className="ui-input" placeholder="Ville" value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} />
      </div>
      <label className="ui-check">
        <input type="checkbox" checked={f.charte} onChange={(e) => setF({ ...f, charte: e.target.checked })} required />
        <span>
          J’accepte la <Link href="/communaute/charte">charte</Link>
        </span>
      </label>
      {error && (
        <p className="c-note c-note--error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="btn">
        Rejoindre
      </button>
    </form>
  );
}

export function MemberRow({ member, onFollow }: { member: PublicMember; onFollow?: (on: boolean) => void }) {
  const [on, setOn] = useState(false);
  return (
    <li className="c-member">
      <Link href={`/membres/${member.handle}`} className="c-member__link">
        <Avatar name={member.name} size={36} />
        <span>
          <span className="c-member__name">{member.name}</span>
          <span className="c-member__meta">{[member.domain, member.city].filter(Boolean).join(' · ') || `@${member.handle}`}</span>
        </span>
      </Link>
      <button
        type="button"
        className={`c-follow${on ? ' is-on' : ''}`}
        onClick={async () => {
          setOn(!on);
          await call(`/api/communaute/membres/${member.handle}/suivre`, 'POST', { on: !on }).catch(() => setOn(on));
          onFollow?.(!on);
        }}
      >
        {on ? 'Suivi' : 'Suivre'}
      </button>
    </li>
  );
}
