/** La marque : un trait de surligneur sous le « dé » de Décode. */
export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`wordmark ${className}`}>
      <span className="wordmark__hl stroke" aria-hidden="true" />
      <span className="wordmark__text">décode</span>
    </span>
  );
}
