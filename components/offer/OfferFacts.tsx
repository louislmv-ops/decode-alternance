import { formatEuros, formatPay } from '@/lib/format';
import { type PayContext, payEstimate } from '@/lib/offers/pay-estimate';
import { payDisplay } from '@/lib/offers/pay-display';
import { PayEuros } from './PayTier';

/** L'essentiel d'une offre en quatre cases : la paie, le lieu, le rythme, le contrat. */
export function OfferFacts({
  payCents,
  payMaxCents = null,
  minimumCents,
  community = null,
  company,
  place,
  rhythm,
  contract,
}: {
  payCents: number | null;
  /** Haut de la fourchette, ou plafond d'un « jusqu'à » quand l'annonce ne garantit pas de montant. */
  payMaxCents?: number | null;
  minimumCents: number;
  community?: PayContext | null;
  company: string | null;
  place: string | null;
  rhythm: string | null;
  contract: string | null;
}) {
  const e = payEstimate(payCents, minimumCents, community?.community ?? null, community?.legalGrid ?? false);
  const shown = payDisplay(e, minimumCents);
  const mapQuery = [company, place].filter(Boolean).join(' ');
  return (
    <dl className="facts">
      <div className="facts__item facts__item--pay">
        <dt>Paie</dt>
        <dd>
          <PayEuros tier={shown.tier} size="large" hint={shown.hint} />
          <span className="facts__sub num">
            {e.source === 'annonce'
              ? `${formatPay(e.cents, payMaxCents)} brut / mois`
              : payMaxCents
                ? `${shown.word}, jusqu’à ${formatEuros(payMaxCents, 0)} selon profil d’après l’annonce`
                : e.source === 'alternants'
                  ? `${shown.word} · tendance de ${e.count} alternants`
                  : `${shown.word} · montant non précisé`}
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
