'use client';

import { Fragment, useMemo, useState } from 'react';
import { bingo, findJargon, type Hit, uniqueHits } from '@/lib/jargon';

type AiJargon = { expression: string; traduction: string }[];
const NONE: AiJargon = [];

/** La grille et la liste des formules repérées : ce qu'elles veulent souvent dire, et quoi demander. */
export function BullshitBingo({ text, ai = NONE }: { text: string; ai?: AiJargon }) {
  const hits = useMemo(() => findJargon(text, ai), [text, ai]);
  const list = uniqueHits(hits);
  const grid = bingo(hits);
  const count = grid.cells.filter((c) => c.found).length;
  if (list.length === 0) return null;

  return (
    <section className="panel bingo" aria-labelledby="bingo-title">
      <div className="panel__head">
        <h2 id="bingo-title">Bullshit Bingo</h2>
        <span className={`bingo__score${grid.lines > 0 ? ' is-bingo' : ''}`}>{grid.lines > 0 ? 'Bingo !' : `${count} / 9`}</span>
      </div>
      <ol className="bingo__grid" aria-label="La grille">
        {grid.cells.map((c) => (
          <li key={c.id} className={c.found ? 'is-on' : undefined} aria-label={`${c.label}${c.found ? ' : dans l’annonce' : ''}`}>
            {c.label}
          </li>
        ))}
      </ol>
      <ul className="bingo__list" role="list">
        {list.map((h) => (
          <li key={`${h.start}`}>
            <q>{h.text}</q>
            <span>{h.traduction}</span>
          </li>
        ))}
      </ul>
      <p className="panel__note">Ce que ces formules veulent souvent dire, pas un avis sur cette entreprise.</p>
    </section>
  );
}

/** Le texte de l'annonce, ses formules surlignées ; un toucher affiche la traduction. */
export function JargonText({ text, ai = NONE }: { text: string; ai?: AiJargon }) {
  const hits = useMemo(() => findJargon(text, ai), [text, ai]);
  const [open, setOpen] = useState<number | null>(null);
  const parts: (string | Hit)[] = [];
  let at = 0;
  for (const h of hits) {
    if (h.start > at) parts.push(text.slice(at, h.start));
    parts.push(h);
    at = h.end;
  }
  parts.push(text.slice(at));

  return (
    <p className="raw-text">
      {parts.map((p, i) =>
        typeof p === 'string' ? (
          <Fragment key={i}>{p}</Fragment>
        ) : (
          <span key={i} className="jargon">
            <button type="button" className="jargon__mark" aria-expanded={open === p.start} onClick={() => setOpen(open === p.start ? null : p.start)}>
              {p.text}
            </button>
            {open === p.start && (
              <span className="jargon__tip" role="note">
                {p.traduction}
              </span>
            )}
          </span>
        ),
      )}
    </p>
  );
}
