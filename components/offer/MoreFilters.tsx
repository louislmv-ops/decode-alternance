'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { Emoji } from '@/components/Emoji';
import { MIN_SALARIES, SKILL_OPTIONS } from '@/lib/offers/filter-options';
import { SECTORS } from '@/lib/offers/sectors';
import { COMPANY_SIZE_LABELS, type CompanySizeTag, type OfferFilters } from '@/lib/offers/types';

const SIZES: { value: CompanySizeTag; label: string }[] = [
  { value: 'grande', label: 'Grande entreprise' },
  { value: 'eti', label: 'Entreprise de taille intermédiaire' },
  { value: 'pme', label: COMPANY_SIZE_LABELS.pme },
  { value: 'tpe', label: COMPANY_SIZE_LABELS.tpe },
];

/** Tout le reste des filtres, dans un panneau qu'on valide une fois : tri, taille, secteur, salaire… */
export function MoreFilters({ filters, count }: { filters: OfferFilters; count: number }) {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button type="button" className={`chip chip--button${count ? ' is-on' : ''}`} onClick={() => dialog.current?.showModal()}>
        <span>Plus de filtres{count ? ` (${count})` : ''}</span>
      </button>
      <dialog ref={dialog} className="sheet" data-manual aria-labelledby="more-title">
        <div className="sheet__head">
          <h2 id="more-title">Filtres</h2>
          <button type="button" className="sheet__close" onClick={() => dialog.current?.close()} aria-label="Fermer">
            ×
          </button>
        </div>

        <fieldset className="sheet__group">
          <legend>Contrat</legend>
          <label className="sheet__opt">
            <input type="radio" name="contrat" value="" defaultChecked={!filters.contract} /> Tous
          </label>
          <label className="sheet__opt">
            <input type="radio" name="contrat" value="apprentissage" defaultChecked={filters.contract === 'apprentissage'} /> Apprentissage
          </label>
          <label className="sheet__opt">
            <input type="radio" name="contrat" value="professionnalisation" defaultChecked={filters.contract === 'professionnalisation'} /> Contrat de professionnalisation
          </label>
        </fieldset>

        <fieldset className="sheet__group">
          <legend>Candidature</legend>
          <label className="sheet__opt">
            <input type="checkbox" name="direct" value="1" defaultChecked={filters.direct} /> Publiée par l’entreprise elle-même
          </label>
        </fieldset>

        <fieldset className="sheet__group">
          <legend>Salaire</legend>
          <label className="sheet__opt">
            <input type="checkbox" name="salaire" value="1" defaultChecked={filters.withSalary} /> <Emoji name="billets" /> Salaire affiché dans l’annonce
          </label>
          <label className="sheet__select">
            <span>Au moins (brut par mois)</span>
            <select name="salairemin" defaultValue={filters.minSalaryCents ? String(filters.minSalaryCents / 100) : ''}>
              <option value="">Peu importe</option>
              {MIN_SALARIES.map((euros) => (
                <option key={euros} value={euros}>
                  {euros.toLocaleString('fr-FR')} €
                </option>
              ))}
            </select>
          </label>
        </fieldset>

        <fieldset className="sheet__group">
          <legend>Compétence demandée</legend>
          <label className="sheet__select">
            <span className="sr-only">Compétence citée dans l’annonce</span>
            <select name="competence" defaultValue={filters.skill ?? ''}>
              <option value="">Toutes</option>
              {SKILL_OPTIONS.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </fieldset>

        <fieldset className="sheet__group">
          <legend>Taille de l’entreprise</legend>
          {SIZES.map((s) => (
            <label key={s.value} className="sheet__opt">
              <input type="checkbox" name="taille" value={s.value} defaultChecked={filters.sizes?.includes(s.value)} /> {s.label}
            </label>
          ))}
        </fieldset>

        <fieldset className="sheet__group">
          <legend>Secteur</legend>
          <div className="sheet__cols">
            {SECTORS.map((s) => (
              <label key={s.code} className="sheet__opt">
                <input type="checkbox" name="secteur" value={s.code} defaultChecked={filters.sectors?.includes(s.code)} /> {s.label}
              </label>
            ))}
          </div>
        </fieldset>

        <p className="sheet__hint">Ces filtres écartent les offres qui ne disent rien de ce qu’ils demandent : taille, secteur, salaire, compétence.</p>

        <div className="sheet__foot">
          <Link href="/offres" className="link">
            Réinitialiser
          </Link>
          <button type="submit" className="btn">
            Voir les offres
          </button>
        </div>
      </dialog>
    </>
  );
}
