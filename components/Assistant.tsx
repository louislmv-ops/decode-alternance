'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Fragment, useEffect, useRef, useState } from 'react';

type Message = { role: 'user' | 'assistant'; content: string };

const STORE = 'decode-assistant';
const SUGGESTIONS = ['Combien je vais toucher en alternance ?', 'Comment marche le décodeur ?', 'Aide-moi pour ma lettre de motivation', 'Je n’ai pas encore d’entreprise, je fais quoi ?'];

/** Les chemins du site cités par l'assistant deviennent des liens. */
function withLinks(text: string) {
  return text.split(/(\/[a-z][a-z0-9/-]*)/g).map((part, i) =>
    i % 2 === 1 ? (
      <Link key={i} className="link" href={part}>
        {part}
      </Link>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}

/** L'assistant du site : une bulle en bas de l'écran, qui répond grâce à l'IA. */
export function Assistant() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORE);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved) setMessages(JSON.parse(saved) as Message[]);
    } catch {
      /* stockage indisponible : la conversation repart de zéro */
    }
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORE, JSON.stringify(messages.slice(-20)));
    } catch {
      /* rien à faire */
    }
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, busy]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  async function send(text: string) {
    const question = text.trim();
    if (!question || busy) return;
    const next: Message[] = [...messages, { role: 'user', content: question }];
    setMessages(next);
    setDraft('');
    setError(null);
    setBusy(true);
    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next.slice(-10), page: pathname }),
      });
      const data = (await res.json().catch(() => ({}))) as { reply?: string; error?: string };
      if (!res.ok || !data.reply) throw new Error(data.error ?? 'L’assistant ne répond pas. Réessaie dans un instant.');
      setMessages([...next, { role: 'assistant', content: data.reply }]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (pathname?.startsWith('/offres/swipe')) return null;

  return (
    <div className={`assistant${open ? ' is-open' : ''}`}>
      {open && (
        <section className="assistant__panel" role="dialog" aria-label="Assistant Décode">
          <header className="assistant__head">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img key={messages.length} src="/decode/logo.webp" alt="" width={256} height={256} className="assistant__avatar" />
            <div>
              <p className="assistant__name">Décode</p>
              <p className="assistant__status">Ton assistant alternance</p>
            </div>
            {messages.length > 0 && (
              <button type="button" className="assistant__reset" onClick={() => setMessages([])}>
                Effacer
              </button>
            )}
            <button type="button" className="assistant__close" aria-label="Fermer l’assistant" onClick={() => setOpen(false)}>
              ×
            </button>
          </header>

          <div className="assistant__list" ref={listRef} aria-live="polite">
            <p className="assistant__msg assistant__msg--bot">
              Salut ! Une question sur l’alternance ou le site ?
            </p>
            {messages.map((m, i) => (
              <p key={i} className={`assistant__msg assistant__msg--${m.role === 'user' ? 'me' : 'bot'}`}>
                {m.role === 'assistant' ? withLinks(m.content) : m.content}
              </p>
            ))}
            {busy && (
              <p className="assistant__msg assistant__msg--bot assistant__typing" aria-label="Décode écrit">
                <span />
                <span />
                <span />
              </p>
            )}
            {error && (
              <p className="assistant__error" role="alert">
                {error}
              </p>
            )}
            {messages.length === 0 && !busy && (
              <div className="assistant__chips">
                {SUGGESTIONS.map((s) => (
                  <button key={s} type="button" className="assistant__chip" onClick={() => send(s)}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form
            className="assistant__form"
            onSubmit={(e) => {
              e.preventDefault();
              void send(draft);
            }}
          >
            <textarea
              ref={inputRef}
              className="assistant__input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void send(draft);
                }
              }}
              placeholder="Ta question…"
              rows={1}
              maxLength={2000}
              aria-label="Ta question"
            />
            <button type="submit" className="assistant__send" disabled={busy || !draft.trim()} aria-label="Envoyer">
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M8 13V3M3.5 7.5 8 3l4.5 4.5" />
              </svg>
            </button>
          </form>
          <p className="assistant__note">Réponses d’une IA : vérifie l’important. Ne partage pas tes coordonnées.</p>
        </section>
      )}

      <button
        type="button"
        className="assistant__launcher"
        aria-expanded={open}
        aria-label={open ? 'Fermer l’assistant' : 'Ouvrir l’assistant'}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="assistant__launcher-label">Une question ?</span>
        <span className="assistant__mascot">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/decode/content-256.webp" alt="" width={256} height={256} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="assistant__mascot-wink" src="/decode/clin-oeil-256.webp" alt="" width={256} height={256} loading="lazy" />
        </span>
      </button>
    </div>
  );
}
