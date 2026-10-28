import Link from 'next/link';
import { Emoji } from '@/components/Emoji';
import { DEPARTMENT_NAMES } from '@/lib/departments';
import { relativeDays } from '@/lib/format';
import type { Highlights } from '@/lib/offers/highlights';
import { payDisplay } from '@/lib/offers/pay-display';
import { detailsOf, REMOTE_LABELS } from '@/lib/offers/details';
import { extractPerks } from '@/lib/offers/perks';
import { cleanTitle } from '@/lib/offers/title';
import { offerHref } from '@/lib/offers/link';
import type { Offer } from '@/lib/offers/types';
import { logoSrc } from '@/lib/offers/logo';
import { CompanyLogo } from './CompanyLogo';
import { MatchBadge } from './Match';
import { PayEuros } from './PayTier';
import { LikeButton } from './LikeButton';
import { SponsorBeacon } from './SponsorBeacon';
import { tasteOf } from '@/lib/taste';

/** Publiée depuis moins de 48 heures. */
const isNew = (iso: string) => Date.now() - Date.parse(iso) < 2 * 86_400_000;

const CONTRACT_LABELS = { apprentissage: 'Apprentissage', professionnalisation: 'Contrat pro', alternance: 'Alternance' };

/** Une offre, une ligne : l'entreprise, le poste en grand, une ligne d'infos, la paie. Rien d'autre. */
export function OfferRow({ offer, h }: { offer: Offer; h: Highlights }) {
  const pay = payDisplay(h.estimate, h.minimumCents, h.lean);
  const { remote } = detailsOf(offer);
  // Le télétravail est déjà dans la ligne d'infos : pas besoin de le répéter en étiquette.
  const allPerks = extractPerks(offer.description);
  const perks = allPerks.filter((p) => !(remote && remote !== 'aucun' && /t[ée]l[ée]travail/i.test(p)));
  const town = offer.city ?? (offer.department ? DEPARTMENT_NAMES[offer.department] : null);
  // Dans une recherche « autour de » : la distance, à vol d'oiseau.
  const place = town && offer.distanceKm != null ? `${town} (${offer.distanceKm < 1 ? 'moins de 1' : offer.distanceKm} km)` : town;
  return (
    <li className={`orow${h.pepite ? ' is-pepite' : ''}${offer.sponsored ? ' is-sponsored' : ''}`}>
      {offer.sponsored && offer.sponsorId && <SponsorBeacon id={offer.sponsorId} />}
      <CompanyLogo src={logoSrc(offer)} name={offer.company} />
      <div className="orow__body">
        <p className="orow__company">
          <span>{offer.company ?? 'Entreprise non nommée'}</span>
          {offer.sponsored && <span className="orow__sponsored">Sponsorisé</span>}
          {h.pepite && <span className="orow__flag"><Emoji name="feu" /> Pépite</span>}
          <MatchBadge offer={{ title: offer.title, department: offer.department, diplomaLevel: offer.diplomaLevel }} />
        </p>
        <Link href={offerHref(offer)} className="orow__title">
          {cleanTitle(offer.title)}
        </Link>
        <p className="orow__meta">
          {isNew(offer.publishedAt) && <span className="orow__new">Nouveau</span>}
          {[place, CONTRACT_LABELS[offer.contract], remote && remote !== 'aucun' ? REMOTE_LABELS[remote] : null, offer.direct ? 'Direct entreprise' : null, relativeDays(offer.publishedAt)]
            .filter(Boolean)
            .join(' · ')}
          {offer.easyApply && <span className="orow__easy"> · <Emoji name="eclair" /> Candidature simplifiée</span>}
        </p>
        {perks.length > 0 && (
          <ul className="orow__perks" aria-label="Avantages cités dans l’annonce">
            {perks.slice(0, 2).map((p) => (
              <li key={p}>{p}</li>
            ))}
            {perks.length > 2 && <li className="orow__perks-more">+{perks.length - 2}</li>}
          </ul>
        )}
        {(h.schoolBait || h.pay?.verdict === 'sous-le-minimum') && (
          <p className="orow__alerts">
            {h.schoolBait && <span className="pill pill--alert">Offre d’école ?</span>}
            {h.pay?.verdict === 'sous-le-minimum' && <span className="pill pill--alert">Sous le minimum légal</span>}
          </p>
        )}
      </div>
      <div className="orow__pay">
        <span className="orow__tier">
          {pay.kind === 'annonce' && pay.tier === 3 && <Emoji name="billets" />}
          <PayEuros tier={pay.tier} hint={pay.hint} />
        </span>
        <span className={`orow__payword orow__payword--${pay.tier ?? 'none'}`} aria-hidden="true">
          {pay.word}
        </span>
      </div>
      <LikeButton className="orow__like" item={tasteOf(offer, offerHref(offer), allPerks)} />
      <svg className="orow__arrow" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M4 10h11M11 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </li>
  );
}
