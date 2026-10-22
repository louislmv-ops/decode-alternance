'use client';

import { useProfile } from '@/components/useProfile';
import { matchOffer, type MatchOffer } from '@/lib/offers/match';

/** Sur une carte : la compatibilité avec ton profil, en une étiquette. */
export function MatchBadge({ offer }: { offer: MatchOffer }) {
  const [profile] = useProfile();
  const match = matchOffer(offer, profile);
  if (!match) return null;
  const total = match.fits.length + match.misses.length;
  if (match.misses.length === 0) return <span className="match match--full">Colle à ton profil</span>;
  return (
    <span className="match" title={match.misses.join(' · ')}>
      {match.fits.length}/{total} critères
    </span>
  );
}

/** Sur une fiche : ce qui colle, ce qui te manque. */
export function MatchPanel({ offer }: { offer: MatchOffer }) {
  const [profile] = useProfile();
  const match = matchOffer(offer, profile);
  if (!match) return null;
  return (
    <section className="match-panel" aria-label="Compatibilité avec ton profil">
      {match.fits.length > 0 && (
        <p>
          <strong>Ce qui colle :</strong> {match.fits.join(' · ')}
        </p>
      )}
      {match.misses.length > 0 && (
        <p>
          <strong>Ce qui te manque :</strong> {match.misses.join(' · ')}
        </p>
      )}
    </section>
  );
}
