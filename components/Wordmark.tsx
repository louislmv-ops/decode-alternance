/**
 * La marque : le mot « décode », dont le « o » est la planète de Décode, avec son anneau.
 * Tout en vectoriel : net à toutes les tailles, sur la barre comme dans le pied de page.
 */
export function Wordmark({ className = '' }: { className?: string }) {
  // Les mêmes identifiants dans la barre et le pied de page : les dégradés sont identiques, peu importe lequel sert.
  const id = 'wm';
  return (
    <span className={`wordmark ${className}`} role="img" aria-label="décode">
      <span aria-hidden="true">déc</span>
      <svg className="wordmark__o" viewBox="0 0 48 32" aria-hidden="true">
        <defs>
          <radialGradient id={`${id}s`} cx="36%" cy="30%" r="75%">
            <stop offset="0" stopColor="#efe6ff" />
            <stop offset="0.35" stopColor="#a77bff" />
            <stop offset="0.75" stopColor="#5b21ff" />
            <stop offset="1" stopColor="#2a1180" />
          </radialGradient>
          <linearGradient id={`${id}r`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#ff9ad5" />
            <stop offset="0.5" stopColor="#ffe066" />
            <stop offset="1" stopColor="#b69cff" />
          </linearGradient>
          {/* La moitié avant de l'anneau passe devant la planète. */}
          <clipPath id={`${id}f`}>
            <rect x="-30" y="0" width="60" height="20" transform="rotate(-16 24 16) translate(24 16)" />
          </clipPath>
        </defs>
        <ellipse cx="24" cy="16" rx="22.5" ry="4.6" transform="rotate(-16 24 16)" fill="none" stroke={`url(#${id}r)`} strokeWidth="2.2" opacity="0.75" />
        <circle cx="24" cy="16" r="13.6" fill={`url(#${id}s)`} />
        <circle cx="29" cy="21" r="2.3" fill="#ff9ad5" opacity="0.8" />
        <ellipse cx="24" cy="16" rx="22.5" ry="4.6" transform="rotate(-16 24 16)" fill="none" stroke={`url(#${id}r)`} strokeWidth="2.2" clipPath={`url(#${id}f)`} />
      </svg>
      <span aria-hidden="true">de</span>
    </span>
  );
}
