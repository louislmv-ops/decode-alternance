'use client';

import { useState } from 'react';
import type { DecodedOffer } from '@/lib/decode/schema';
import { useProfile } from '@/components/useProfile';
import { minimumSalary } from '@/lib/rules/salary';
import { DecodedView, type OfferMeta } from './DecodedView';
import { OfferFacts } from './OfferFacts';

/** Une offre pas encore traduite : son texte brut, et le bouton qui demande la traduction. */
export function UndecodedOffer({ offer, description }: { offer: OfferMeta; description: string }) {
  const [state, setState] = useState<{ status: 'idle' | 'loading' } | { status: 'error'; message: string } | { status: 'done'; decoded: DecodedOffer }>({
    status: 'idle',
  });

  const [profile] = useProfile();
  if (state.status === 'done') return <DecodedView decoded={state.decoded} offer={offer} />;
  const minimum = minimumSalary({ contract: profile.contract, age: profile.age, year: profile.year, hasBacPro: profile.hasBacPro });

  async function decode() {
    setState({ status: 'loading' });
    try {
      const res = await fetch('/api/decode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerId: offer.id }),
      });
      const data = (await res.json()) as { decoded?: DecodedOffer; error?: string };
      if (!res.ok || !data.decoded) throw new Error(data.error ?? 'La traduction a échoué.');
      setState({ status: 'done', decoded: data.decoded });
    } catch (error) {
      setState({ status: 'error', message: (error as Error).message });
    }
  }

  return (
    <div className="screen">
      <div className="title-row">
        <div>
          <h1>{offer.title}</h1>
          <p className="title-row__sub">{[offer.company ?? 'Entreprise non nommée', offer.city, offer.sourceLabel].filter(Boolean).join(' · ')}</p>
        </div>
        <div className="title-row__actions">
          <button type="button" className="ui-btn ui-btn--primary" onClick={decode} disabled={state.status === 'loading'}>
            {state.status === 'loading' ? 'Décodage en cours…' : 'Décoder cette offre'}
          </button>
        </div>
      </div>
      <OfferFacts payCents={offer.salaryCents} minimumCents={minimum.cents} company={offer.company} place={offer.city} rhythm={null} contract={offer.contract} />
      {state.status === 'idle' && (
        <p className="decode-pitch">
          Un clic : les missions en clair, ta semaine type, les pièges, qui contacter dans l’équipe et quoi mettre en avant.
        </p>
      )}
      {state.status === 'error' && (
        <p className="notice notice--error" role="alert">
          {state.message}
        </p>
      )}
      {state.status === 'loading' && (
        <p className="notice" role="status">
          Décode lit l’annonce. Compte une vingtaine de secondes.
        </p>
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
        <p className="raw-text">{description}</p>
      </section>
    </div>
  );
}
