import { formatEuros } from '@/lib/format';
import { payTier } from '@/lib/offers/pay-tier';
import { PayEuros } from './PayTier';

/** L'essentiel d'une offre en quatre cases : la paie, le lieu, le rythme, le contrat. */
export function OfferFacts({
  payCents,
  minimumCents,
  company,
  place,
  rhythm,
  contract,
}: {
  payCents: number | null;
  minimumCents: number;
  company: string | null;
  place: string | null;
  rhythm: string | null;
  contract: string | null;
}) {
  const mapQuery = [company, place].filter(Boolean).join(' ');
  return (
    <dl className="facts">
      <div className="facts__item facts__item--pay">
        <dt>Paie</dt>
        <dd>
          <PayEuros tier={payTier(payCents, minimumCents)} size="large" />
          <span className="facts__sub num">{payCents !== null ? `${formatEuros(payCents, 0)} brut / mois` : `Non chiffré · ${formatEuros(minimumCents, 0)} min. garanti`}</span>
        </dd>
      </div>
      <div className="facts__item">
        <dt>Où</dt>
        <dd>
          <span className="facts__main">{place ?? 'Non précisé'}</span>
          {place && (
            <a className="facts__link" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`} target="_blank" rel="noopener noreferrer">
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
