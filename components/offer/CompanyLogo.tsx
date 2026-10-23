'use client';

import { useState } from 'react';

/** Le logo de l'entreprise, ou son initiale quand il n'y en a pas. */
export function CompanyLogo({ src, name, size = 48 }: { src: string | null; name: string | null; size?: number }) {
  const [failed, setFailed] = useState(false);
  const initial = (name ?? '?').trim().charAt(0).toUpperCase() || '?';
  return (
    <span className="clogo" style={{ width: size, height: size }} aria-hidden="true">
      {src && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element -- petite image servie et mise en cache par /api/logo
        <img src={src} alt="" width={size} height={size} loading="lazy" decoding="async" onError={() => setFailed(true)} />
      ) : (
        <span className="clogo__initial" style={{ fontSize: size * 0.42 }}>
          {initial}
        </span>
      )}
    </span>
  );
}
