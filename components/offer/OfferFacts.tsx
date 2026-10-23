import { formatEuros } from '@/lib/format';
import { type PayContext, payEstimate } from '@/lib/offers/pay-estimate';
import { payTier } from '@/lib/offers/pay-tier';
import { PayEuros } from './PayTier';

/** L'essentiel d'une offre en quatre cases : la paie, le lieu, le rythme, le contrat. */
export function OfferFacts({
  payCents,
  minimumCents,
  community = null,
  company,
  place,
  rhythm,
  contract,
}: {
  payCents: number | null;
  minimumCents: number;
  community?: PayContext | null;
  company: string | null;
  place: string | null;
  rhythm: string | null;
  contract: string | null;
}) {
  const e = payEstimate(payCents, minimumCents, community?.community ?? null, community?.legalGrid ?? false);
  const mapQuery = [company, place].filter(Boolean).join(' ');
  return (
    <dl className="facts">
      <div className="facts__item facts__item--pay">
        <dt>Paie</dt>
        <dd>
          <PayEuros tier={payTier(e.cents, minimumCents)} size="large" />
          <span className="facts__sub num">
            {e.source === 'annonce'
              ? `${formatEuros(e.cents, 0)} brut / mois`
              : e.source === 'alternants'
                ? `≈ ${formatEuros(e.cents, 0)} · ${e.count} alternants`
                : `Au moins ${formatEuros(e.cents, 0)} · minimum légal`}
          </span>
        </dd>
      </div>
      <div className="facts__item">
        <dt>Où</dt>
        <dd>
          <span className="facts__main">{place ?? 'Non précisé'}</span>
          {place && (
            <a
              className="facts__link"
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Voir le trajet
            </a>
          )}
        </dd>
      </div>
      <div className="facts__item">
        <dt>Rythme</dt>
        <dd>
          <span className="facts__main">{rhythm ?? 'À demander'}</span>
        </dd>
      </div>
      <div className="facts__item">
        <dt>Contrat</dt>
        <dd>
          <span className="facts__main">{contract ?? 'Alternance'}</span>
        </dd>
      </div>
    </dl>
  );
}
