import Link from 'next/link';
import { DEPARTMENT_NAMES } from '@/lib/departments';
import { formatEuros, relativeDays } from '@/lib/format';
import type { Highlights } from '@/lib/offers/highlights';
import { payTier } from '@/lib/offers/pay-tier';
import { cleanTitle } from '@/lib/offers/title';
import { type Offer, offerHref } from '@/lib/offers/types';
import { logoSrc } from '@/lib/offers/logo';
import { CompanyLogo } from './CompanyLogo';
import { MatchBadge } from './Match';
import { PayEuros } from './PayTier';

const CONTRACT_LABELS = { apprentissage: 'Apprentissage', professionnalisation: 'Contrat pro', alternance: 'Alternance' };

/** Une offre, une ligne : l'entreprise, le poste en grand, une ligne d'infos, la paie. Rien d'autre. */
export function OfferRow({ offer, h }: { offer: Offer; h: Highlights }) {
  const place = offer.city ?? (offer.department ? DEPARTMENT_NAMES[offer.department] : null);
  const paid = offer.salaryMonthlyCents !== null;
  const diff = h.pay && h.pay.verdict !== 'sous-le-minimum' && h.pay.diffPercent > 0 ? `+${h.pay.diffPercent} % vs ton minimum` : null;
  return (
    <li className={`orow${h.pepite ? ' is-pepite' : ''}`}>
      <CompanyLogo src={logoSrc(offer)} name={offer.company} />
      <div className="orow__body">
        <p className="orow__company">
          <span>{offer.company ?? 'Entreprise non nommée'}</span>
          {h.pepite && <span className="orow__flag">Pépite</span>}
          <MatchBadge offer={{ title: offer.title, department: offer.department, diplomaLevel: offer.diplomaLevel }} />
        </p>
        <Link href={offerHref(offer)} className="orow__title">
          {cleanTitle(offer.title)}
        </Link>
        <p className="orow__meta">
          {[place, CONTRACT_LABELS[offer.contract], offer.direct ? 'Direct entreprise' : null, relativeDays(offer.publishedAt)].filter(Boolean).join(' · ')}
        </p>
        {(h.schoolBait || h.pay?.verdict === 'sous-le-minimum') && (
          <p className="orow__alerts">
            {h.schoolBait && <span className="pill pill--alert">Offre d’école ?</span>}
            {h.pay?.verdict === 'sous-le-minimum' && <span className="pill pill--alert">Sous le minimum légal</span>}
          </p>
        )}
      </div>
      <div className="orow__pay">
        <PayEuros tier={payTier(offer.salaryMonthlyCents, h.minimumCents)} />
        {paid ? <strong className="num">{formatEuros(offer.salaryMonthlyCents!, 0)}</strong> : <span className="orow__none">Non chiffré</span>}
        <span className="orow__sub num">{paid ? diff : `min. ${formatEuros(h.minimumCents, 0)}`}</span>
      </div>
      <svg className="orow__arrow" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M4 10h11M11 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </li>
  );
}
