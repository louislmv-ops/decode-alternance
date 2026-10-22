import Link from 'next/link';
import { DEPARTMENT_NAMES } from '@/lib/departments';
import { formatEuros, relativeDays } from '@/lib/format';
import type { Highlights } from '@/lib/offers/highlights';
import { payTier } from '@/lib/offers/pay-tier';
import type { Offer } from '@/lib/offers/types';
import { MatchBadge } from './Match';
import { PayEuros } from './PayTier';

const CONTRACT_LABELS = { apprentissage: 'Apprentissage', professionnalisation: 'Contrat pro', alternance: 'Alternance' };

function payLabel(pay: Highlights['pay']): string {
  if (!pay) return '';
  if (pay.verdict === 'sous-le-minimum') return 'sous ton minimum';
  if (pay.verdict === 'au-minimum') return 'ton minimum légal';
  return `+${pay.diffPercent} % vs ton minimum`;
}

/** L'initiale de l'entreprise, en monogramme. */
function Avatar({ name }: { name: string | null }) {
  return (
    <span className="offer-card__avatar" aria-hidden="true">
      {(name ?? '?').trim().charAt(0).toUpperCase()}
    </span>
  );
}

export function OfferCard({ offer, h, reveal }: { offer: Offer; h: Highlights; reveal?: number }) {
  const place = offer.city ?? (offer.department ? DEPARTMENT_NAMES[offer.department] : null);
  return (
    <li
      className={`offer-card${h.pepite ? ' is-pepite' : ''}`}
      data-reveal={reveal === undefined ? undefined : true}
      style={reveal === undefined ? undefined : ({ '--i': reveal } as React.CSSProperties)}
    >
      <Avatar name={offer.company} />
      <div className="offer-card__main">
        <Link href={`/offres/${encodeURIComponent(offer.id)}`} className="offer-card__title">
          {offer.title}
        </Link>
        <p className="offer-card__meta">
          {[offer.company ?? 'Entreprise non nommée', place].filter(Boolean).join(' · ')}
        </p>
        <div className="offer-card__tags">
          <MatchBadge offer={{ title: offer.title, department: offer.department, diplomaLevel: offer.diplomaLevel }} />
          <span className="tag">{CONTRACT_LABELS[offer.contract]}</span>
          {offer.direct && <span className="tag">Direct entreprise</span>}
          {h.bigCompany && !h.schoolBait && <span className="pepite">Grande entreprise</span>}
          {h.schoolBait && <span className="pill pill--alert">Offre d’école ?</span>}
          {h.pay?.verdict === 'sous-le-minimum' && <span className="pill pill--alert">Sous le minimum légal</span>}
        </div>
      </div>
      <div className="offer-card__side">
        <PayEuros tier={payTier(offer.salaryMonthlyCents, h.minimumCents)} />
        {offer.salaryMonthlyCents !== null ? (
          <>
            <span className="num offer-card__amount">{formatEuros(offer.salaryMonthlyCents, 0)}</span>
            <span className="offer-card__sub num">{payLabel(h.pay)}</span>
          </>
        ) : (
          <>
            <span className="offer-card__amount offer-card__amount--none">Non chiffré</span>
            <span className="offer-card__sub num">min. {formatEuros(h.minimumCents, 0)}</span>
          </>
        )}
        <span className="offer-card__date">{relativeDays(offer.publishedAt)}</span>
      </div>
    </li>
  );
}
