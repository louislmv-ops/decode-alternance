'use client';

import { SORT_OPTIONS, type OfferSort } from '@/lib/offers/rank';

/** « Trier par », à côté du nombre d'offres. Rattaché au formulaire de recherche pour garder les filtres. */
export function SortSelect({ formId, value }: { formId: string; value: OfferSort }) {
  return (
    <label className="sort">
      <span>Trier par</span>
      <select
        name="tri"
        form={formId}
        defaultValue={value}
        onChange={() => (document.getElementById(formId) as HTMLFormElement | null)?.requestSubmit()}
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
