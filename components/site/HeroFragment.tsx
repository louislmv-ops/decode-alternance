'use client';

import { useState } from 'react';
import { minimumSalary, comparePay } from '@/lib/rules/salary';
import { formatEuros } from '@/lib/format';

const PAIRS = [
  {
    jargon: 'Être force de proposition dans la veille concurrentielle',
    plain: 'Tu surveilles ce que font les marques concurrentes et tu proposes des idées.',
  },
  {
    jargon: 'Contribuer à la formalisation des recommandations',
    plain: 'Tu tires deux ou trois conclusions claires des chiffres, pour les équipes.',
  },
  {
    jargon: 'Assurer le reporting mensuel des KPIs marque',
    plain: 'Chaque mois, tu mets à jour le tableau des chiffres clés et tu l’envoies.',
  },
];

const OFFER_CENTS = 148_000;

/** Un morceau de la vraie fiche d'offre : bascule entre l'annonce brute et sa traduction. */
export function HeroFragment() {
  const [view, setView] = useState<'clair' | 'annonce'>('clair');
  const minimum = minimumSalary({ contract: 'apprentissage', age: 21, year: 1, hasBacPro: false });
  const pay = comparePay(OFFER_CENTS, minimum.cents);

  return (
    <div className="ui-card hero-fragment" data-ui>
      <div className="hero-fragment__head">
        <div>
          <p className="ui-title">Chargé d’études marketing</p>
          <p className="ui-meta">Groupe Orvane · Paris 9e · Alternance 24 mois · Exemple fictif</p>
        </div>
        <div className="ui-segmented" role="group" aria-label="Affichage de l’offre">
          <button type="button" aria-pressed={view === 'annonce'} onClick={() => setView('annonce')}>
            L’annonce
          </button>
          <button type="button" aria-pressed={view === 'clair'} onClick={() => setView('clair')}>
            En clair
          </button>
        </div>
      </div>

      <div className="hero-fragment__tags">
        <span className="pepite stroke">Grande entreprise</span>
        <span className="pepite stroke">+{pay.diffPercent} % au-dessus du minimum</span>
      </div>

      {view === 'clair' ? (
        <ul className="hero-fragment__pairs">
          {PAIRS.map((p) => (
            <li key={p.jargon}>
              <s className="ui-jargon">{p.jargon}</s>
              <span className="ui-plain">{p.plain}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="hero-fragment__raw">
          Au sein de la Direction Marketing Insights, vous interviendrez sur des sujets transverses à forte visibilité.{' '}
          <mark>Être force de proposition dans la veille concurrentielle</mark> et{' '}
          <mark>contribuer à la formalisation des recommandations</mark>. Vous êtes rigoureux(se), doté(e) d’un excellent
          relationnel. <mark>Assurer le reporting mensuel des KPIs marque.</mark>
        </p>
      )}

      <dl className="ui-kv">
        <div>
          <dt>Salaire annoncé</dt>
          <dd className="num">{formatEuros(OFFER_CENTS)}</dd>
        </div>
        <div>
          <dt>Ton minimum légal (21 ans, 1re année)</dt>
          <dd className="num">{formatEuros(minimum.cents)}</dd>
        </div>
        <div>
          <dt>Rythme</dt>
          <dd>3 jours entreprise, 2 jours école</dd>
        </div>
      </dl>
    </div>
  );
}
