'use client';

import { useRef, useState } from 'react';
import { formatDate } from '@/lib/format';
import { type Application, CHANNELS, type Column, COLUMNS, columnOf, isFollowUpDue } from '@/lib/tracker';

interface Drag {
  id: string;
  x: number;
  y: number;
  width: number;
  /** Où la carte a été saisie, pour qu'elle ne saute pas sous le doigt. */
  dx: number;
  dy: number;
  over: Column | null;
}

/** Près des bords, le tableau défile tout seul pendant qu'on traîne une carte (sur téléphone, une colonne à la fois). */
const EDGE = 48;

/**
 * Le suivi en colonnes : on fait glisser une carte par sa poignée, à la souris ou au doigt.
 * Le menu « Déplacer vers » fait la même chose au clavier et pour les lecteurs d'écran.
 */
export function KanbanBoard({
  apps,
  today,
  onMove,
  onRemove,
}: {
  apps: Application[];
  today: string;
  onMove: (id: string, column: Column) => void;
  onRemove: (id: string) => void;
}) {
  const [drag, setDrag] = useState<Drag | null>(null);
  const board = useRef<HTMLDivElement>(null);
  const dragged = drag ? apps.find((a) => a.id === drag.id) : null;

  function columnAt(x: number, y: number): Column | null {
    for (const el of document.elementsFromPoint(x, y)) {
      const col = (el as HTMLElement).dataset?.col;
      if (col) return col as Column;
    }
    return null;
  }

  function start(e: React.PointerEvent<HTMLButtonElement>, app: Application) {
    const card = e.currentTarget.closest('.kcard') as HTMLElement | null;
    if (!card) return;
    const r = card.getBoundingClientRect();
    // Pas de sélection de texte pendant qu'on traîne la carte.
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag({ id: app.id, x: e.clientX, y: e.clientY, width: r.width, dx: e.clientX - r.left, dy: e.clientY - r.top, over: columnOf(app.status) });
  }

  function move(e: React.PointerEvent) {
    if (!drag) return;
    const el = board.current;
    if (el) {
      const r = el.getBoundingClientRect();
      if (e.clientX < r.left + EDGE) el.scrollLeft -= 12;
      else if (e.clientX > r.right - EDGE) el.scrollLeft += 12;
    }
    setDrag({ ...drag, x: e.clientX, y: e.clientY, over: columnAt(e.clientX, e.clientY) ?? drag.over });
  }

  function end() {
    if (drag?.over) onMove(drag.id, drag.over);
    setDrag(null);
  }

  return (
    <>
      <div ref={board} className={`kanban${drag ? ' is-dragging' : ''}`}>
        {COLUMNS.map((col) => {
          const cards = apps.filter((a) => columnOf(a.status) === col.value);
          return (
            <section key={col.value} className={`kcol kcol--${col.value}${drag?.over === col.value ? ' is-over' : ''}`} data-col={col.value} aria-label={col.label}>
              <h3 className="kcol__head">
                {col.label} <span className="num">{cards.length}</span>
              </h3>
              <ul className="kcol__cards" role="list">
                {cards.map((a) => (
                  <li key={a.id} className={`kcard${drag?.id === a.id ? ' is-ghosted' : ''}`}>
                    <button
                      type="button"
                      className="kcard__grip"
                      aria-label={`Faire glisser ${a.company}`}
                      onPointerDown={(e) => start(e, a)}
                      onPointerMove={move}
                      onPointerUp={end}
                      onPointerCancel={() => setDrag(null)}
                    >
                      <svg width="14" height="20" viewBox="0 0 14 20" fill="currentColor" aria-hidden="true">
                        {[3, 10, 17].flatMap((y) => [3, 11].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.6" />))}
                      </svg>
                    </button>
                    <CardBody app={a} today={today} />
                    <div className="kcard__actions">
                      <label>
                        <span className="sr-only">Déplacer {a.company} vers</span>
                        <select className="kcard__move" value={columnOf(a.status)} onChange={(e) => onMove(a.id, e.target.value as Column)}>
                          {COLUMNS.map((c) => (
                            <option key={c.value} value={c.value}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <button type="button" className="kcard__remove" onClick={() => onRemove(a.id)} aria-label={`Supprimer ${a.company}`}>
                        ×
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              {cards.length === 0 && <p className="kcol__empty">Glisse une carte ici</p>}
            </section>
          );
        })}
      </div>
      {drag && dragged && (
        <div className="kcard kcard--float" style={{ width: drag.width, transform: `translate(${drag.x - drag.dx}px, ${drag.y - drag.dy}px) rotate(2deg)` }} aria-hidden="true">
          <CardBody app={dragged} today={today} />
        </div>
      )}
    </>
  );
}

function CardBody({ app, today }: { app: Application; today: string }) {
  const channel = CHANNELS.find((c) => c.value === app.channel)?.label;
  return (
    <div className="kcard__body">
      <p className="kcard__company">
        {app.url ? (
          <a href={app.url} target="_blank" rel="noopener noreferrer">
            {app.company}
          </a>
        ) : (
          app.company
        )}
      </p>
      {app.title && <p className="kcard__title">{app.title}</p>}
      <p className="kcard__meta">
        {[channel, app.sentAt ? `envoyée le ${formatDate(app.sentAt, true)}` : null].filter(Boolean).join(' · ')}
      </p>
      {(app.status === 'relancee' || isFollowUpDue(app, today)) && (
        <p className="kcard__tags">
          {app.status === 'relancee' && <span className="kcard__tag">Relancée</span>}
          {isFollowUpDue(app, today) && <span className="kcard__tag kcard__tag--due">À relancer</span>}
        </p>
      )}
    </div>
  );
}
