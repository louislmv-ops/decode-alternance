/** La marque : le mot « décode », dont le « o » est Décode, la mascotte. */
export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`wordmark ${className}`} role="img" aria-label="décode">
      <span aria-hidden="true">déc</span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="wordmark__o" src="/decode/logo-o.webp" alt="" aria-hidden="true" width={256} height={210} />
      <span aria-hidden="true">de</span>
    </span>
  );
}
