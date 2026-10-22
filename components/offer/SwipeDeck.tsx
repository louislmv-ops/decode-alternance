'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTracker } from '@/components/useTracker';
import { formatEuros } from '@/lib/format';
import type { PayTier } from '@/lib/offers/pay-tier';
import { PayEuros } from './PayTier';

export interface SwipeCard {
  id: string;
  href: string;
  company: string;
  title: string;
  facts: string;
  payCents: number | null;
  minimumCents: number;
  tier: PayTier | null;
  diffPercent: number | null;
  pepite: boolean;
}

/** Au-delà de ce déplacement (en px), le geste vaut décision. */
const THRESHOLD = 110;

export function SwipeDeck({ cards, nextHref }: { cards: SwipeCard[]; nextHref: string | null }) {
  const { add, apps } = useTracker();
  const [index, setIndex] = useState(0);
  const [kept, setKept] = useState(0);
  const [dx, setDx] = useState(0);
  const [leaving, setLeaving] = useState<'left' | 'right' | null>(null);
  const start = useRef<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const card = cards[index];

  const decide = useCallback(
    (dir: 'left' | 'right') => {
      if (!card || leaving) return;
      if (dir === 'right') {
        const url = card.href;
        if (!apps.some((a) => a.url === url)) {
          add({ company: card.company, title: card.title, url, channel: 'offre', status: 'a-envoyer', sentAt: null, followedUpAt: null, notes: '' });
        }
        setKept((k) => k + 1);
      }
      setLeaving(dir);
      window.setTimeout(() => {
        setLeaving(null);
        setDx(0);
        setIndex((i) => i + 1);
      }, 220);
    },
    [card, leaving, apps, add],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') decide('right');
      if (e.key === 'ArrowLeft') decide('left');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [decide]);

  if (!card) {
    return (
      <div className="swipe swipe--end">
        <p className="swipe__done">C’est tout pour cette série.</p>
        <p className="c-note">
          {kept > 0 ? `${kept} offre${kept > 1 ? 's' : ''} gardée${kept > 1 ? 's' : ''} dans ton suivi.` : 'Aucune offre gardée.'}
        </p>
        <div className="swipe__end-actions">
          {kept > 0 && (
            <Link href="/suivi" className="btn">
              Mon suivi
            </Link>
          )}
          {nextHref && (
            <Link href={nextHref} className="ui-btn">
              Offres suivantes
            </Link>
          )}
          <Link href="/offres" className="ui-btn">
            Revenir à la liste
          </Link>
        </div>
      </div>
    );
  }

  const offset = leaving === 'right' ? 600 : leaving === 'left' ? -600 : dx;
  return (
    <div className="swipe">
      <div className="swipe__top">
        <Link href="/offres" className="link">
          Liste
        </Link>
        <span className="num">
          {index + 1} / {cards.length}
        </span>
      </div>

      <div className="swipe__stack">
        {cards[index + 1] && <div className="swipe__card swipe__card--under" aria-hidden="true" />}
        <article
          className="swipe__card"
          style={{ transform: `translateX(${offset}px) rotate(${offset / 22}deg)`, transition: dragging ? 'none' : 'transform 220ms ease' }}
          onPointerDown={(e) => {
            start.current = e.clientX;
            setDragging(true);
            (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => start.current !== null && setDx(e.clientX - start.current)}
          onPointerUp={() => {
            start.current = null;
            setDragging(false);
            if (dx > THRESHOLD) decide('right');
            else if (dx < -THRESHOLD) decide('left');
            else setDx(0);
          }}
          onPointerCancel={() => {
            start.current = null;
            setDragging(false);
            setDx(0);
          }}
        >
          <span className={`swipe__stamp swipe__stamp--keep${dx > 40 ? ' is-on' : ''}`} aria-hidden="true">
            Je garde
          </span>
          <span className={`swipe__stamp swipe__stamp--pass${dx < -40 ? ' is-on' : ''}`} aria-hidden="true">
            Je passe
          </span>
          <p className="orow__company">
            <span>{card.company}</span>
            {card.pepite && <span className="orow__flag">Pépite</span>}
          </p>
          <h1 className="swipe__title">{card.title}</h1>
          <p className="orow__meta">{card.facts}</p>
          <div className="swipe__pay">
            <PayEuros tier={card.tier} size="large" />
            {card.payCents !== null ? (
              <strong className="num">{formatEuros(card.payCents, 0)}</strong>
            ) : (
              <span className="orow__none">Non chiffré · min. {formatEuros(card.minimumCents, 0)}</span>
            )}
            {card.diffPercent !== null && <span className="orow__sub num">+{card.diffPercent} % vs ton minimum</span>}
          </div>
          <Link href={card.href} className="link swipe__open" onPointerDown={(e) => e.stopPropagation()}>
            Voir l’offre décodée
          </Link>
        </article>
      </div>

      <div className="swipe__actions">
        <button type="button" className="swipe__btn swipe__btn--pass" onClick={() => decide('left')} aria-label="Je passe">
          ✕
        </button>
        <button type="button" className="swipe__btn swipe__btn--keep" onClick={() => decide('right')} aria-label="Je garde, dans mon suivi">
          ♥
        </button>
      </div>
      <p className="swipe__hint">Glisse à droite pour garder dans ton suivi, à gauche pour passer. Flèches du clavier aussi.</p>
    </div>
  );
}
