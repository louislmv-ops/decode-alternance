/** La marque : « décode » avec le « dé » passé au surligneur citron. */
export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`wordmark ${className}`}>
      <span className="wordmark__hl">dé</span>code
    </span>
  );
}
