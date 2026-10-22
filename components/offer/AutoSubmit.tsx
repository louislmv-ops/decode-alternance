'use client';

import { useEffect } from 'react';

/** Les filtres en pastilles s'appliquent dès qu'on les change, sans chercher le bouton. */
export function AutoSubmit({ formId }: { formId: string }) {
  useEffect(() => {
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (!form) return;
    const onChange = (e: Event) => {
      if ((e.target as HTMLElement).matches('select, input[type="checkbox"]')) form.requestSubmit();
    };
    form.addEventListener('change', onChange);
    return () => form.removeEventListener('change', onChange);
  }, [formId]);
  return null;
}
