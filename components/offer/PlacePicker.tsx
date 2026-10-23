'use client';

import { useMemo, useRef, useState } from 'react';
import { IconPin } from '@/components/app/Icons';
import { DEPARTMENT_NAMES, DEPARTMENT_OPTIONS } from '@/lib/departments';
import { locateDepartment, MAX_DEPARTMENTS, savePlace } from '@/lib/place';

// Recherche tolérante (« reunion » trouve « La Réunion ») sans charger les outils serveur côté navigateur.
const fold = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

/** « Où » : un ou plusieurs départements, avec la localisation en un clic. Le choix est retenu. */
export function PlacePicker({ formId, selected }: { formId: string; selected: string[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  // Le choix affiché vient toujours de la page (adresse ou lieu retenu) : il suit les rafraîchissements.
  const chosen = selected;
  const [draft, setDraft] = useState<string[]>(selected);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<{ busy: boolean; error: string | null }>({ busy: false, error: null });

  const list = useMemo(() => {
    const words = fold(search.trim());
    return words ? DEPARTMENT_OPTIONS.filter((d) => fold(`${d.code} ${d.name}`).includes(words)) : DEPARTMENT_OPTIONS;
  }, [search]);

  const label =
    chosen.length === 0 ? 'Toute la France' : chosen.length === 1 ? DEPARTMENT_NAMES[chosen[0]!] : `${DEPARTMENT_NAMES[chosen[0]!]} + ${chosen.length - 1}`;

  function apply(next: string[]) {
    savePlace(next);
    dialog.current?.close();
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (!form) return;
    // Lu par AutoSubmit, qui remplace les départements de la recherche par ce choix.
    form.dataset.dep = next.length ? next.join('.') : 'fr';
    form.requestSubmit();
  }

  function toggle(code: string) {
    setDraft((d) => (d.includes(code) ? d.filter((x) => x !== code) : d.length >= MAX_DEPARTMENTS ? d : [...d, code]));
  }

  async function locate() {
    setStatus({ busy: true, error: null });
    try {
      const { department } = await locateDepartment();
      setDraft((d) => (d.includes(department) ? d : [department, ...d].slice(0, MAX_DEPARTMENTS)));
      setStatus({ busy: false, error: null });
    } catch (error) {
      setStatus({ busy: false, error: (error as Error).message });
    }
  }

  return (
    <>
      {chosen.length ? chosen.map((d) => <input key={d} type="hidden" name="dep" value={d} />) : <input type="hidden" name="dep" value="fr" />}
      <button
        type="button"
        className={`chip chip--button${chosen.length ? ' is-on' : ''}`}
        onClick={() => {
          setDraft(chosen);
          dialog.current?.showModal();
        }}
      >
        <span>{label}</span>
      </button>
      <dialog ref={dialog} className="sheet" data-manual aria-labelledby="place-title" onClose={() => setSearch('')}>
        <div className="sheet__head">
          <h2 id="place-title">Où tu cherches</h2>
          <button type="button" className="sheet__close" onClick={() => dialog.current?.close()} aria-label="Fermer">
            ×
          </button>
        </div>
        <button type="button" className="btn btn--small sheet__locate" onClick={locate} disabled={status.busy}>
          {status.busy ? (
            'Localisation…'
          ) : (
            <>
              <IconPin /> Me localiser
            </>
          )}
        </button>
        {status.error && (
          <p className="sheet__error" role="alert">
            {status.error}
          </p>
        )}
        {draft.length > 0 && (
          <p className="sheet__picked">
            {draft.map((d) => (
              <button key={d} type="button" className="tag-x" onClick={() => toggle(d)} aria-label={`Retirer ${DEPARTMENT_NAMES[d]}`}>
                {DEPARTMENT_NAMES[d]} ×
              </button>
            ))}
          </p>
        )}
        <label className="sheet__search">
          <span className="sr-only">Chercher un département</span>
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Département ou numéro" />
        </label>
        <ul className="sheet__list" role="list">
          {list.map((d) => (
            <li key={d.code}>
              <label>
                <input type="checkbox" checked={draft.includes(d.code)} onChange={() => toggle(d.code)} />
                <span className="num">{d.code}</span> {d.name}
              </label>
            </li>
          ))}
        </ul>
        <p className="sheet__hint">Jusqu’à {MAX_DEPARTMENTS} départements.</p>
        <div className="sheet__foot">
          <button type="button" className="link" onClick={() => apply([])}>
            Toute la France
          </button>
          <button type="button" className="btn" onClick={() => apply(draft)}>
            Voir les offres
          </button>
        </div>
      </dialog>
    </>
  );
}
