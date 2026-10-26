'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { PublicAccount } from '@/lib/account/http';
import { applicationMessage } from '@/lib/account/message';
import type { CvMeta } from '@/lib/account/store';
import { cleanTitle } from '@/lib/offers/title';

const signedIn = () => typeof document !== 'undefined' && document.cookie.split('; ').includes('decode_connecte=1');

/**
 * Postuler en deux clics : ton CV, un message prêt à copier, puis le site de l'offre.
 * On postule toujours sur le site d'origine : Décode prépare, il n'envoie rien à ta place.
 */
export function ApplyKit({ offer }: { offer: { title: string; company: string | null; sourceUrl: string } }) {
  const [state, setState] = useState<{ account: PublicAccount; cv: CvMeta | null } | null | undefined>(undefined);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!signedIn()) return setState(null);
    fetch('/api/compte')
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { account?: PublicAccount; cv?: CvMeta | null } | null) => setState(d?.account ? { account: d.account, cv: d.cv ?? null } : null))
      .catch(() => setState(null));
  }, []);

  if (state === undefined) return null;
  if (state === null) {
    return (
      <section className="panel apply-kit apply-kit--pitch" data-needs="comptes" aria-labelledby="apply-title">
        <h2 id="apply-title">Postule en 2 clics</h2>
        <p className="panel__note">Ajoute ton CV une fois : Décode te prépare la candidature sur chaque offre.</p>
        <Link href="/compte" className="btn btn--small">
          Créer mon compte
        </Link>
      </section>
    );
  }

  const message = applicationMessage(state.account.candidate ?? {}, { title: cleanTitle(offer.title), company: offer.company });
  const external = /^https?:\/\//.test(offer.sourceUrl);
  return (
    <section className="panel apply-kit" aria-labelledby="apply-title">
      <div className="panel__head">
        <h2 id="apply-title">Postule en 2 clics</h2>
        <Link href="/compte" className="panel__link">
          Modifier mon dossier
        </Link>
      </div>
      <ol className="apply-kit__steps">
        <li>
          <span className="apply-kit__n">1</span>
          {state.cv ? (
            <a className="ui-btn" href="/api/compte/cv">
              Télécharger mon CV ({state.cv.name})
            </a>
          ) : (
            <Link className="ui-btn" href="/compte">
              Ajouter mon CV
            </Link>
          )}
        </li>
        <li className="apply-kit__msg">
          <span className="apply-kit__n">2</span>
          <div>
            <textarea className="ui-textarea" readOnly rows={7} value={message} aria-label="Ton message de candidature" />
            <button
              type="button"
              className="ui-btn"
              onClick={() => {
                void navigator.clipboard?.writeText(message).then(() => {
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 2000);
                });
              }}
            >
              {copied ? 'Copié' : 'Copier mon message'}
            </button>
          </div>
        </li>
        {external && (
          <li>
            <span className="apply-kit__n">3</span>
            <a className="ui-btn ui-btn--primary" href={offer.sourceUrl} target="_blank" rel="noopener noreferrer">
              Postuler sur le site d’origine
            </a>
          </li>
        )}
      </ol>
      {!state.account.candidate?.firstName && <p className="panel__note">Complète ton dossier (prénom, pitch) pour un message plus personnel.</p>}
    </section>
  );
}
