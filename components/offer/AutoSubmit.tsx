'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Les filtres en pastilles s'appliquent dès qu'on les change, sans chercher le bouton. Sauf dans un panneau à
 * valider (data-manual). L'adresse produite ne garde que les filtres choisis, sans les valeurs vides.
 */
export function AutoSubmit({ formId }: { formId: string }) {
  const router = useRouter();
  useEffect(() => {
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (!form) return;
    const onChange = (e: Event) => {
      const target = e.target as HTMLElement;
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
      if (form.dataset.dep) {
        params.delete('dep');
        for (const d of form.dataset.dep.split('.')) params.append('dep', d);
        delete form.dataset.dep;
      }
      router.push(`${form.getAttribute('action') ?? ''}?${params}`);
    };
    form.addEventListener('change', onChange);
    form.addEventListener('submit', onSubmit);
    return () => {
      form.removeEventListener('change', onChange);
      form.removeEventListener('submit', onSubmit);
    };
  }, [formId, router]);
  return null;
}
