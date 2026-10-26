'use client';

import { useRouter } from 'next/navigation';
import { IconPin } from '@/components/app/Icons';
import { useState } from 'react';
import { DEPARTMENT_OPTIONS } from '@/lib/departments';
import { locateDepartment, savePlace } from '@/lib/place';

/** Au premier passage : où chercher ? La réponse est retenue, et les offres se recentrent tout de suite. */
export function LocationPrompt() {
  const router = useRouter();
  const [status, setStatus] = useState<{ busy: boolean; error: string | null }>({ busy: false, error: null });

  function choose(departments: string[]) {
    savePlace(departments);
    router.refresh();
  }

  async function locate() {
    setStatus({ busy: true, error: null });
    try {
      const { department } = await locateDepartment();
      choose([department]);
    } catch (error) {
      setStatus({ busy: false, error: (error as Error).message });
    }
  }

  return (
    <section className="locate" aria-labelledby="locate-title">
      <p id="locate-title" className="locate__title">
        Tu cherches où ?
      </p>
      <p className="locate__text">Les offres près de chez toi d’abord.</p>
      <div className="locate__actions">
        <button type="button" className="btn btn--small" onClick={locate} disabled={status.busy}>
          {status.busy ? (
            'Localisation…'
          ) : (
            <>
              <IconPin /> Me localiser
            </>
          )}
        </button>
        <label className="locate__select">
          <span className="sr-only">Choisir un département</span>
          <select defaultValue="" onChange={(e) => e.target.value && choose([e.target.value])}>
            <option value="">Choisir un département</option>
            {DEPARTMENT_OPTIONS.map((d) => (
              <option key={d.code} value={d.code}>
                {d.code} · {d.name}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="link" onClick={() => choose([])}>
          Toute la France
        </button>
      </div>
      {status.error && (
        <p className="locate__error" role="alert">
          {status.error}
        </p>
      )}
    </section>
  );
}
