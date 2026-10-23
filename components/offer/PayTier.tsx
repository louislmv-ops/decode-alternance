import { PAY_TIER_LABELS, type PayTier } from '@/lib/offers/pay-tier';

/** Les « € » : pleins jusqu'à la note, estompés au-delà. */
export function PayEuros({ tier, size = 'small', hint }: { tier: PayTier | null; size?: 'small' | 'large'; hint?: string }) {
  if (tier === null) {
    return (
      <span className={`euros euros--${size} euros--none`} title="Salaire non chiffré dans l’annonce">
        <span aria-hidden="true">€€€</span>
        <span className="sr-only">Salaire non chiffré</span>
      </span>
    );
  }
  return (
    <span className={`euros euros--${size}`} title={hint ?? PAY_TIER_LABELS[tier]}>
      <span aria-hidden="true">
        {[1, 2, 3].map((n) => (
          <span key={n} className={n <= tier ? 'euros__on' : 'euros__off'}>
            €
          </span>
        ))}
      </span>
      <span className="sr-only">
        {hint ?? PAY_TIER_LABELS[tier]}
      </span>
    </span>
  );
}
