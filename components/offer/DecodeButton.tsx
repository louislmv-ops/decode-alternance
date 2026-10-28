'use client';

import { useEffect, useRef, useState } from 'react';
import { OfferMap } from './OfferMap';
import { CompanyInsight } from './CompanyInsight';
import { Mascotte } from '@/components/Mascotte';
import type { DecodedOffer } from '@/lib/decode/schema';
import { Emoji } from '@/components/Emoji';
import { useProfile } from '@/components/useProfile';
import { relativeDays } from '@/lib/format';
import { contractForOffer, conventionMinimum, minimumSalary } from '@/lib/rules/salary';
import { ConventionPay } from './ConventionPay';
import { DecodedView, type OfferMeta } from './DecodedView';
import { MatchPanel } from './Match';
import { OfferFacts } from './OfferFacts';
import { PayPanel } from './PayPanel';
import { PerksPanel } from './Perks';
import { ApplyKit } from './ApplyKit';
import { BullshitBingo, JargonText } from './BullshitBingo';
import { LikeButton } from './LikeButton';
import { requestDecode } from './decode-request';

/** Même plafond que la route de traduction (MAX_OFFER_CHARS), qui n'est pas importable côté navigateur. */
const MAX_TEXT = 12_000;

/** Une offre pas encore traduite : son texte brut, et le bouton qui demande la traduction. */
export function UndecodedOffer({ offer, description }: { offer: OfferMeta; description: string }) {
  const [state, setState] = useState<{ status: 'idle' | 'loading' } | { status: 'error'; message: string } | { status: 'done'; decoded: DecodedOffer }>({
    status: 'idle',
  });

  const [profile] = useProfile();
  const started = useRef(false);
  // L'IA se lance seule à l'ouverture, sauf pour les robots : en cas de refus (quota, panne), on revient au bouton sans bruit.
  useEffect(() => {
    if (started.current || /bot|crawl|spider|lighthouse/i.test(navigator.userAgent) || navigator.webdriver) return;
    started.current = true;
    void decode(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (state.status === 'done') return <DecodedView decoded={state.decoded} offer={offer} />;
  const salaryInput = { contract: contractForOffer(offer.contractKind, profile.contract), age: profile.age, year: profile.year, hasBacPro: profile.hasBacPro };
  const legalMinimum = minimumSalary(salaryInput);
  const conv = conventionMinimum(salaryInput, offer.pay?.conventions.map((c) => c.idcc) ?? [], offer.diplomaLevel ?? null);
  const minimum = conv ? { ...legalMinimum, cents: conv.cents } : legalMinimum;

  async function decode(auto = false) {
    setState({ status: 'loading' });
    try {
      // Le texte part avec l'identifiant : une offre d'agrégateur n'est gardée qu'en mémoire, pas toujours là où tourne la traduction.
      const decoded = await requestDecode({ offerId: offer.id, text: [offer.title, offer.company ?? '', offer.city ?? '', '', description].join('\n').slice(0, MAX_TEXT) });
      setState({ status: 'done', decoded });
    } catch (error) {
      setState(auto ? { status: 'idle' } : { status: 'error', message: (error as Error).message });
    }
  }

  return (
    <div className="screen">
      <div className="title-row">
        <div>
          <h1>{offer.title}</h1>
          <p className="title-row__sub">{[
              offer.company ?? 'Entreprise non nommée',
              offer.city,
              offer.sourceLabel,
              offer.publishedAt ? `publiée ${relativeDays(offer.publishedAt)}` : null,
            ]
              .filter(Boolean)
              .join(' · ')}
            {offer.easyApply && <> · <Emoji name="eclair" /> Candidature simplifiée</>}</p>
        </div>
        <div className="title-row__actions">
          {offer.taste && <LikeButton item={offer.taste} className="like--big" />}
          <button type="button" className="ui-btn ui-btn--primary" onClick={() => decode()} disabled={state.status === 'loading'}>
            {state.status === 'loading' ? 'Décodage en cours…' : 'Décoder cette offre'}
          </button>
        </div>
      </div>
      <OfferFacts
        payCents={offer.salaryCents}
        payMaxCents={offer.salaryMaxCents ?? null}
        minimumCents={minimum.cents}
        community={offer.pay ?? null}
        company={offer.company}
        place={offer.city}
        rhythm={null}
        contract={offer.contract}
      />
      {conv && <ConventionPay conv={conv} legalCents={legalMinimum.cents} />}
      {!offer.isExample && offer.company && <CompanyInsight company={offer.company} context={offer.pay ?? null} />}
      {offer.place && <OfferMap place={offer.place} />}
      <MatchPanel offer={{ title: offer.title, department: offer.department, diplomaLevel: offer.diplomaLevel }} />
      <PerksPanel perks={offer.perks ?? []} />
      {!offer.isExample && <ApplyKit offer={{ title: offer.title, company: offer.company, sourceUrl: offer.sourceUrl }} />}
      <PayPanel
        announcedCents={offer.salaryCents}
        announcedMaxCents={offer.salaryMaxCents ?? null}
        context={offer.pay ?? null}
        sourceLabel={offer.sourceLabel}
        offerContract={offer.contractKind ?? null}
        folded
      />
      {state.status === 'idle' && (
        <div className="decode-pitch">
          <p>Ce que tu feras vraiment, les points de vigilance, et comment sortir du lot.</p>
        </div>
      )}
      {state.status === 'error' && (
        <p className="notice notice--error" role="alert">
          {state.message}
        </p>
      )}
      {state.status === 'loading' && (
        <div className="decode-wait" role="status">
          <Mascotte pose="loupe" size={72} className="decode-wait__mascotte" />
          <div>
            <p className="decode-wait__title">Décode lit l’annonce à ta place…</p>
            <p className="decode-wait__sub">Missions, salaire, points de vigilance : une vingtaine de secondes.</p>
            <span className="decode-wait__bar" aria-hidden="true" />
          </div>
        </div>
      )}
      <section className="panel" aria-labelledby="raw-title">
        <div className="panel__head">
          <h2 id="raw-title">L’annonce telle qu’elle est publiée</h2>
          {/^https?:\/\//.test(offer.sourceUrl) && (
            <a className="panel__link" href={offer.sourceUrl} target="_blank" rel="noopener noreferrer">
              Voir sur le site d’origine
            </a>
          )}
        </div>
        <JargonText text={description} />
      </section>
      <BullshitBingo text={description} />
    </div>
  );
}
