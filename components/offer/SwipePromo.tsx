import Link from 'next/link';

/**
 * Sur téléphone, le mode swipe s'annonce en grand : une mini-pile de cartes montre le geste,
 * Décode fait un clin d'œil. Masquée sur ordinateur, où la liste reste plus pratique.
 */
export function SwipePromo({ href = '/offres/swipe' }: { href?: string }) {
  return (
    <Link href={href} className="swipe-promo">
      <span className="swipe-promo__stack" aria-hidden="true">
        <span className="swipe-promo__card swipe-promo__card--back" />
        <span className="swipe-promo__card swipe-promo__card--mid" />
        <span className="swipe-promo__card swipe-promo__card--top">
          <span className="swipe-promo__line swipe-promo__line--title" />
          <span className="swipe-promo__line" />
          <span className="swipe-promo__line swipe-promo__line--short" />
          <span className="swipe-promo__stamp">Je garde</span>
        </span>
      </span>
      <span className="swipe-promo__text">
        <strong>Swipe les offres</strong>
        <span>Garde ou passe d’un geste, une offre à la fois.</span>
        <span className="swipe-promo__go">Essayer</span>
      </span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="swipe-promo__mascotte" src="/decode/clin-oeil-256.webp" alt="" width={256} height={256} loading="lazy" aria-hidden="true" />
    </Link>
  );
}
