'use client';

import { useLikes } from '@/components/useLikes';
import { scoreOffer, type TasteItem } from '@/lib/taste';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Emoji } from '@/components/Emoji';
import { useTracker } from '@/components/useTracker';
import type { PayTier } from '@/lib/offers/pay-tier';
import { CompanyLogo } from './CompanyLogo';
import { PayEuros } from './PayTier';
import { Mascotte } from '@/components/Mascotte';
import { afterDecision, type Category, EMPTY_MEMORY, parseMemory, SWIPE_KEY, type SwipeMemory, unhide } from '@/lib/swipe';

export interface SwipeCard {
  id: string;
  href: string;
  logo: string | null;
  company: string;
  title: string;
  facts: string;
  easyApply: boolean;
  tier: PayTier | null;
  /** D'où vient la note : annonce, alternants de l'entreprise ou minimum légal. */
  payHint: string;
  pepite: boolean;
  /** Le résumé gardé pour apprendre les goûts (like à droite, offre passée à gauche). */
  taste: Omit<TasteItem, 'at'>;
  /** Secteur ou domaine : trois refus d'affilée le masquent. */
  category: Category | null;
}

interface Decision {
  id: string;
  dir: 'left' | 'right';
  /** La candidature ajoutée au suivi par ce « je garde », à retirer si on revient en arrière. */
  appId: string | null;
  /** Le compteur des refus avant cette décision. */
  before: SwipeMemory;
}

function loadMemory(): SwipeMemory {
  try {
    return parseMemory(window.localStorage.getItem(SWIPE_KEY));
  } catch {
    return EMPTY_MEMORY;
  }
}

function saveMemory(memory: SwipeMemory) {
  try {
    window.localStorage.setItem(SWIPE_KEY, JSON.stringify(memory));
  } catch {
    // Stockage bloqué : la mémoire vit le temps de la page.
  }
}

/** Au-delà de ce déplacement (en px), le geste vaut décision. */
const THRESHOLD = 110;

export function SwipeDeck({ cards, nextHref }: { cards: SwipeCard[]; nextHref: string | null }) {
  const { add, apps, remove } = useTracker();
  const [dx, setDx] = useState(0);
  const [leaving, setLeaving] = useState<'left' | 'right' | null>(null);
  const start = useRef<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const { likes, like, unlike, pass, unpass, taste } = useLikes();
  const [history, setHistory] = useState<Decision[]>([]);
  const [memory, setMemory] = useState<SwipeMemory>(EMPTY_MEMORY);
  const [toast, setToast] = useState<Category | null>(null);
  // Au début de la série, les offres qui ressemblent le plus aux likes passent en premier.
  const [deck, setDeck] = useState(cards);
  useEffect(() => {
    // La mémoire est dans le navigateur : lue après le premier affichage, pour que serveur et navigateur affichent la même chose.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMemory(loadMemory());
    if (likes.length === 0) return;
    setDeck([...cards].sort((a, b) => scoreOffer(b.taste, taste).score - scoreOffer(a.taste, taste).score));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards]);

  const decided = new Set(history.map((h) => h.id));
  const isHidden = (c: SwipeCard) => Boolean(c.category && memory.hidden[c.category.key]);
  const card = deck.find((c) => !decided.has(c.id) && !isHidden(c));
  const kept = history.filter((h) => h.dir === 'right').length;
  const remaining = deck.filter((c) => !decided.has(c.id) && !isHidden(c)).length;

  const remember = useCallback((next: SwipeMemory) => {
    setMemory(next);
    saveMemory(next);
  }, []);

  const decide = useCallback(
    (dir: 'left' | 'right') => {
      if (!card || leaving) return;
      let appId: string | null = null;
      if (dir === 'right') {
        if (!apps.some((a) => a.url === card.href)) {
          appId = add({ company: card.company, title: card.title, url: card.href, channel: 'offre', status: 'a-envoyer', sentAt: null, followedUpAt: null, notes: '' });
        }
        like(card.taste);
      } else {
        pass(card.taste);
      }
      const next = afterDecision(memory, card.category, dir);
      setLeaving(dir);
      window.setTimeout(() => {
        setLeaving(null);
        setDx(0);
        setHistory((h) => [...h, { id: card.id, dir, appId, before: memory }]);
        remember(next.memory);
        if (next.hid) setToast(next.hid);
      }, 220);
    },
    [card, leaving, apps, add, like, pass, memory, remember],
  );

  /** Revient sur la dernière décision : la carte revient, le like, le refus ou l'ajout au suivi sont annulés. */
  const rewind = useCallback(() => {
    const last = history.at(-1);
    if (!last || leaving) return;
    if (last.dir === 'right') {
      unlike(last.id);
      if (last.appId) remove(last.appId);
    } else {
      unpass(last.id);
    }
    remember(last.before);
    setToast(null);
    setHistory((h) => h.slice(0, -1));
  }, [history, leaving, unlike, unpass, remove, remember]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') decide('right');
      if (e.key === 'ArrowLeft') decide('left');
      if (e.key === 'Backspace' || (e.key === 'z' && (e.metaKey || e.ctrlKey))) rewind();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [decide, rewind]);

  const hiddenList = Object.entries(memory.hidden);
  const hiddenBar = hiddenList.length > 0 && (
    <div className="swipe__hidden" aria-label="Catégories masquées">
      <span>Masquées :</span>
      {hiddenList.map(([key, label]) => (
        <button key={key} type="button" className="chip chip--button" onClick={() => remember(unhide(memory, key))} aria-label={`Afficher à nouveau ${label}`}>
          <span>{label} ×</span>
        </button>
      ))}
    </div>
  );

  if (!card) {
    return (
      <div className="swipe swipe--end">
        <Mascotte pose={kept > 0 ? 'clin-oeil' : 'surpris'} size={144} className="swipe__mascotte" />
        <p className="swipe__done">C’est tout pour cette série.</p>
        <p className="c-note">
          {kept > 0 ? `${kept} offre${kept > 1 ? 's' : ''} gardée${kept > 1 ? 's' : ''}.` : 'Aucune offre gardée.'}
        </p>
        {hiddenBar}
        <div className="swipe__end-actions">
          {history.length > 0 && (
            <button type="button" className="ui-btn" onClick={rewind}>
              Revenir à la dernière
            </button>
          )}
          {kept > 0 && (
            <Link href="/likes" className="btn">
              Mes likes
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
          {history.length + 1} / {history.length + remaining}
        </span>
      </div>
      {hiddenBar}
      {toast && (
        <p className="swipe__toast" role="status">
          {toast.label} masqué : 3 passées d’affilée.{' '}
          <button type="button" className="link link--always" onClick={() => (remember(unhide(memory, toast.key)), setToast(null))}>
            Annuler
          </button>
        </p>
      )}

      <div className="swipe__stack">
        {remaining > 1 && <div className="swipe__card swipe__card--under" aria-hidden="true" />}
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
          <CompanyLogo key={card.id} src={card.logo} name={card.company} size={56} />
          <p className="orow__company">
            <span>{card.company}</span>
            {card.pepite && <span className="orow__flag"><Emoji name="feu" /> Pépite</span>}
          </p>
          <h1 className="swipe__title">{card.title}</h1>
          <p className="orow__meta">
            {card.facts}
            {card.easyApply && <> · <Emoji name="eclair" /> Candidature simplifiée</>}
          </p>
          <div className="swipe__pay">
            <PayEuros tier={card.tier} size="large" hint={card.payHint} />
            <span className="orow__sub">{card.payHint}</span>
          </div>
          <Link href={card.href} className="link swipe__open" onPointerDown={(e) => e.stopPropagation()}>
            Voir l’offre décodée
          </Link>
        </article>
      </div>

      <div className="swipe__actions">
        <button type="button" className="swipe__btn swipe__btn--pass" onClick={() => decide('left')} aria-label="Je passe">
          <Emoji name="croix" size="30px" />
        </button>
        <button type="button" className="swipe__btn swipe__btn--rewind" onClick={rewind} disabled={history.length === 0} aria-label="Revenir à l’offre précédente">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 14L4 9l5-5" />
            <path d="M4 9h11a5 5 0 010 10h-3" />
          </svg>
        </button>
        <button type="button" className="swipe__btn swipe__btn--keep" onClick={() => decide('right')} aria-label="Je garde, dans mon suivi">
          <Emoji name="coeur" size="30px" />
        </button>
      </div>
      <p className="swipe__hint">Droite : je garde. Gauche : je passe. Trois passées d’affilée dans un domaine, et il est masqué.</p>
    </div>
  );
}
