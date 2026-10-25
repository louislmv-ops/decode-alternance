/** La marque : Décode, la mascotte, suivie du mot « décode ». */
export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`wordmark ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="wordmark__mascotte" src="/decode/logo.webp" alt="" aria-hidden="true" width={192} height={192} />
      décode
    </span>
  );
}
