'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useTransition } from 'react';
import { Waiting } from '@/components/states/Waiting';
import { track } from '@/lib/analytics';

/**
 * Les filtres en pastilles s'appliquent dès qu'on les change, sans chercher le bouton. Sauf dans un panneau à
 * valider (data-manual). L'adresse produite ne garde que les filtres choisis, sans les valeurs vides.
 * Pendant que la nouvelle page se charge, un bandeau le dit : loading.tsx ne s'affiche pas quand seuls les filtres changent.
 */
export function AutoSubmit({ formId }: { formId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  useEffect(() => {
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (!form) return;
    const onChange = (e: Event) => {
      const target = e.target as HTMLElement;
      // Un filtre touché par la personne (le texte cherché est compté avec la recherche).
      if (target instanceof HTMLInputElement || target instanceof HTMLSelectElement) {
        if (target.name && target.name !== 'q') {
          const value = target instanceof HTMLInputElement && (target.type === 'checkbox' || target.type === 'radio') ? (target.checked ? target.value : null) : target.value;
          track('filter_used', { filter: target.name, value: value || null });
        }
      }
      if (target.closest('[data-manual]')) return;
      if (target.matches('select, input[type="checkbox"]')) form.requestSubmit();
    };
    const onSubmit = (e: SubmitEvent) => {
      e.preventDefault();
      const params = new URLSearchParams();
      for (const [key, value] of new FormData(form)) {
        if (typeof value !== 'string' || value === '' || (key === 'tri' && value === 'top')) continue;
        params.append(key, value);
      }
      // Un nouveau lieu choisi (PlacePicker) remplace l'ancien : des départements ou un rayon, jamais les deux.
      if (form.dataset.dep || form.dataset.near) {
        for (const key of ['dep', 'autour', 'km', 'ville']) params.delete(key);
      }
      if (form.dataset.dep) {
        for (const d of form.dataset.dep.split('.')) params.append('dep', d);
        delete form.dataset.dep;
      }
      if (form.dataset.near) {
        const [center, km, label] = form.dataset.near.split('|');
        params.set('autour', center ?? '');
        params.set('km', km ?? '');
        params.set('ville', label ?? '');
        delete form.dataset.near;
      }
      startTransition(() => router.push(`${form.getAttribute('action') ?? ''}?${params}`));
    };
    form.addEventListener('change', onChange);
    form.addEventListener('submit', onSubmit);
    return () => {
      form.removeEventListener('change', onChange);
      form.removeEventListener('submit', onSubmit);
    };
  }, [formId, router]);
  return pending ? (
    <div className="search-pending">
      <Waiting title="Décode cherche les offres…" />
    </div>
  ) : null;
}
