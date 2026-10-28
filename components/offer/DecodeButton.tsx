'use client';

import { useEffect, useRef, useState } from 'react';
import { Mascotte } from '@/components/Mascotte';
import type { DecodedOffer } from '@/lib/decode/schema';
import { Emoji } from '@/components/Emoji';
import { useProfile } from '@/components/useProfile';
import { relativeDays } from '@/lib/format';
import { contractForOffer, minimumSalary } from '@/lib/rules/salary';
import { DecodedView, type OfferMeta } from './DecodedView';
import { MatchPanel } from './Match';
import { OfferFacts } from './OfferFacts';
import { PayPanel } from './PayPanel';
import { PerksPanel } from './Perks';
import { ApplyKit } from './ApplyKit';
import { BullshitBingo, JargonText } from './BullshitBingo';
import { LikeButton } from './LikeButton';

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
  const minimum = minimumSalary({ contract: contractForOffer(offer.contractKind, profile.contract), age: profile.age, year: profile.year, hasBacPro: profile.hasBacPro });

  async function decode(auto = false) {
    setState({ status: 'loading' });
    try {
      const res = await fetch('/api/decode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Le texte part avec l'identifiant : une offre d'agrégateur n'est gardée qu'en mémoire, pas toujours là où tourne la traduction.
        body: JSON.stringify({ offerId: offer.id, text: [offer.title, offer.company ?? '', offer.city ?? '', '', description].join('\n').slice(0, MAX_TEXT) }),
      });
      const data = (await res.json()) as { decoded?: DecodedOffer; error?: string };
      if (!res.ok || !data.decoded) throw new Error(data.error ?? 'La traduction a échoué.');
      setState({ status: 'done', decoded: data.decoded });
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
        lean={offer.lean ?? null}
      />
      <MatchPanel offer={{ title: offer.title, department: offer.department, diplomaLevel: offer.diplomaLevel }} />
      <PerksPanel perks={offer.perks ?? []} />
      {!offer.isExample && <ApplyKit offer={{ title: offer.title, company: offer.company, sourceUrl: offer.sourceUrl }} />}
      <PayPanel
        announcedCents={offer.salaryCents}
        announcedMaxCents={offer.salaryMaxCents ?? null}
        context={offer.pay ?? null}
        company={offer.company}
        sourceLabel={offer.sourceLabel}
        offerContract={offer.contractKind ?? null}
        lean={offer.lean ?? null}
      />
      {state.status === 'idle' && (
        <div className="decode-pitch">
          <p>L’offre en clair, les pièges, comment sortir du lot.</p>
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
            <p className="decode-wait__title">Décode lit l’annonce pour toi…</p>
            <p className="decode-wait__sub">Missions en clair, pièges, salaire : une vingtaine de secondes.</p>
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
