'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { IconPin } from '@/components/app/Icons';
import { DEPARTMENT_NAMES, DEPARTMENT_OPTIONS, REGIONS, regionOf } from '@/lib/departments';
import { encodeCenter, KM_OPTIONS, locateDepartment, MAX_DEPARTMENTS, type Near, savePlace } from '@/lib/place';

// Recherche tolérante (« reunion » trouve « La Réunion ») sans charger les outils serveur côté navigateur.
const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

interface City {
  name: string;
  department: string;
  postalCode: string | null;
  lat: number;
  lon: number;
}

/** Le nom court du lieu choisi, pour la pastille. */
export function placeLabel(selected: string[], near: Near | null): string {
  if (near) return `${near.label} · ${near.km} km`;
  if (selected.length === 0) return 'Toute la France';
  const region = regionOf(selected);
  if (region) return region.name;
  return selected.length === 1 ? DEPARTMENT_NAMES[selected[0]!]! : `${DEPARTMENT_NAMES[selected[0]!]} + ${selected.length - 1}`;
}

/** « Où » : autour d'une ville dans un rayon, une région ou des départements, avec la localisation en un clic. Le choix est retenu. */
export function PlacePicker({ formId, selected, near }: { formId: string; selected: string[]; near: Near | null }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState<string[]>(selected);
  const [center, setCenter] = useState<Omit<Near, 'km'> | null>(near);
  const [km, setKm] = useState<number>(near?.km ?? 20);
  const [search, setSearch] = useState('');
  const [cityQuery, setCityQuery] = useState('');
  const [cities, setCities] = useState<City[]>([]);
  const [status, setStatus] = useState<{ busy: boolean; error: string | null }>({ busy: false, error: null });

  const list = useMemo(() => {
    const words = fold(search.trim());
    return words ? DEPARTMENT_OPTIONS.filter((d) => fold(`${d.code} ${d.name}`).includes(words)) : DEPARTMENT_OPTIONS;
  }, [search]);

  // Les villes qui correspondent à la saisie, un court instant après la dernière touche.
  useEffect(() => {
    const q = cityQuery.trim();
    if (q.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/villes?q=${encodeURIComponent(q)}`, { signal: controller.signal })
        .then((res) => res.json() as Promise<{ cities?: City[] }>)
        .then((data) => setCities(data.cities ?? []))
        .catch(() => {});
    }, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [cityQuery]);

  function submit(dataset: { dep?: string; near?: string }) {
    dialog.current?.close();
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (!form) return;
    // Lus par AutoSubmit, qui remplace le lieu de la recherche par ce choix.
    if (dataset.dep) form.dataset.dep = dataset.dep;
    if (dataset.near) form.dataset.near = dataset.near;
    form.requestSubmit();
  }

  function apply() {
    if (center) {
      const chosen: Near = { ...center, km };
      savePlace(chosen);
      submit({ near: `${encodeCenter(chosen)}|${km}|${chosen.label}` });
      return;
    }
    savePlace(draft);
    submit({ dep: draft.length ? draft.join('.') : 'fr' });
  }

  function everywhere() {
    savePlace([]);
    submit({ dep: 'fr' });
  }

  function toggle(code: string) {
    setCenter(null);
    setDraft((d) => (d.includes(code) ? d.filter((x) => x !== code) : d.length >= MAX_DEPARTMENTS ? d : [...d, code]));
  }

  function toggleRegion(departments: string[]) {
    setCenter(null);
    setDraft((d) => (departments.every((x) => d.includes(x)) ? d.filter((x) => !departments.includes(x)) : [...new Set([...d, ...departments])].slice(0, MAX_DEPARTMENTS)));
  }

  function pickCity(city: City) {
    setCenter({ lat: city.lat, lon: city.lon, department: city.department, label: city.name });
    setDraft([]);
    setCityQuery('');
    setCities([]);
  }

  async function locate() {
    setStatus({ busy: true, error: null });
    try {
      const here = await locateDepartment();
      setCenter({ lat: here.lat, lon: here.lon, department: here.department, label: here.city || 'Autour de moi' });
      setDraft([]);
      setStatus({ busy: false, error: null });
    } catch (error) {
      setStatus({ busy: false, error: (error as Error).message });
    }
  }

  return (
    <>
      {near ? (
        <>
          <input type="hidden" name="autour" value={encodeCenter(near)} />
          <input type="hidden" name="km" value={near.km} />
          <input type="hidden" name="ville" value={near.label} />
        </>
      ) : selected.length ? (
        selected.map((d) => <input key={d} type="hidden" name="dep" value={d} />)
      ) : (
        <input type="hidden" name="dep" value="fr" />
      )}
      <button
        type="button"
        className={`chip chip--button${near || selected.length ? ' is-on' : ''}`}
        onClick={() => {
          setDraft(selected);
          setCenter(near);
          setKm(near?.km ?? 20);
          dialog.current?.showModal();
        }}
      >
        <span>{placeLabel(selected, near)}</span>
      </button>
      <dialog ref={dialog} className="sheet" data-manual aria-labelledby="place-title" onClose={() => setSearch('')}>
        <div className="sheet__head">
          <h2 id="place-title">Où tu cherches</h2>
          <button type="button" className="sheet__close" onClick={() => dialog.current?.close()} aria-label="Fermer">
            ×
          </button>
        </div>

        <fieldset className="sheet__group">
          <legend>Autour d’une ville</legend>
          <button type="button" className="btn btn--small" onClick={locate} disabled={status.busy}>
            {status.busy ? (
              'Localisation…'
            ) : (
              <>
                <IconPin /> Autour de moi
              </>
            )}
          </button>
          {status.error && (
            <p className="sheet__error" role="alert">
              {status.error}
            </p>
          )}
          <label className="sheet__search sheet__search--flush">
            <span className="sr-only">Ville ou code postal</span>
            <input type="search" value={cityQuery} onChange={(e) => setCityQuery(e.target.value)} placeholder="Ville ou code postal" autoComplete="off" />
          </label>
          {cityQuery.trim().length >= 2 && cities.length > 0 && (
            <ul className="sheet__cities" role="list">
              {cities.map((c) => (
                <li key={`${c.name}-${c.department}-${c.postalCode}`}>
                  <button type="button" onClick={() => pickCity(c)}>
                    {c.name} <span className="num">({c.department})</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {center && (
            <>
              <p className="sheet__picked sheet__picked--flush">
                <button type="button" className="tag-x" onClick={() => setCenter(null)} aria-label={`Retirer ${center.label}`}>
                  {center.label} ×
                </button>
              </p>
              <div className="sheet__km" role="radiogroup" aria-label="Distance maximale">
                {KM_OPTIONS.map((k) => (
                  <label key={k} className={`chip chip--check${k === km ? ' is-on' : ''}`}>
                    <input type="radio" name="sheet-km" checked={k === km} onChange={() => setKm(k)} />
                    <span>{k} km</span>
                  </label>
                ))}
              </div>
            </>
          )}
        </fieldset>

        <fieldset className="sheet__group">
          <legend>Ou une région</legend>
          <div className="sheet__regions">
            {REGIONS.map((r) => {
              const on = !center && r.departments.every((d) => draft.includes(d));
              return (
                <button key={r.code} type="button" className={`chip chip--button${on ? ' is-on' : ''}`} aria-pressed={on} onClick={() => toggleRegion(r.departments)}>
                  <span>{r.name}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="sheet__group">
          <legend>Ou des départements</legend>
          {!center && draft.length > 0 && (
            <p className="sheet__picked sheet__picked--flush">
              {draft.map((d) => (
                <button key={d} type="button" className="tag-x" onClick={() => toggle(d)} aria-label={`Retirer ${DEPARTMENT_NAMES[d]}`}>
                  {DEPARTMENT_NAMES[d]} ×
                </button>
              ))}
            </p>
          )}
          <label className="sheet__search sheet__search--flush">
            <span className="sr-only">Chercher un département</span>
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Département ou numéro" />
          </label>
          <ul className="sheet__list sheet__list--flush" role="list">
            {list.map((d) => (
              <li key={d.code}>
                <label>
                  <input type="checkbox" checked={!center && draft.includes(d.code)} onChange={() => toggle(d.code)} />
                  <span className="num">{d.code}</span> {d.name}
                </label>
              </li>
            ))}
          </ul>
          <p className="sheet__hint sheet__hint--flush">Jusqu’à {MAX_DEPARTMENTS} départements.</p>
        </fieldset>

        <div className="sheet__foot">
          <button type="button" className="link" onClick={everywhere}>
            Toute la France
          </button>
          <button type="button" className="btn" onClick={apply}>
            {center ? `Voir les offres à ${km} km` : 'Voir les offres'}
          </button>
        </div>
      </dialog>
    </>
  );
}
