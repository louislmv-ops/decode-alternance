'use client';

import { useEffect, useState } from 'react';
import { PayEuros } from '@/components/offer/PayTier';

// Le moment « wow » : une vraie phrase d'annonce barrée, et sa traduction qui arrive.
const PAIRS = [
  { jargon: 'Être force de proposition dans la veille concurrentielle', plain: 'Tu surveilles les concurrents et tu proposes des idées.' },
  { jargon: 'Contribuer à la formalisation des recommandations', plain: 'Tu résumes les chiffres en trois conclusions claires.' },
  { jargon: 'Environnement dynamique et exigeant, forte autonomie attendue', plain: 'Ça va vite, et personne ne te tiendra la main.' },
  { jargon: 'Assurer le reporting mensuel des KPIs marque', plain: 'Chaque mois, tu mets à jour le tableau des chiffres.' },
];

export function HeroDecode() {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => setI((n) => (n + 1) % PAIRS.length), 3600);
    return () => window.clearInterval(timer);
  }, []);

  const pair = PAIRS[i]!;

  return (
    <div className="hdec" data-ui aria-label="Exemple de traduction d’une offre">
      <div className="hdec__head">
        <div>
          <p className="hdec__title">Chargé d’études marketing</p>
          <p className="hdec__meta">Groupe Orvane · Paris 9e · Exemple fictif</p>
        </div>
        <PayEuros tier={3} size="large" />
      </div>

      <div className="hdec__stage" key={i} aria-live="polite">
        <p className="hdec__jargon">
          <span>{pair.jargon}</span>
        </p>
        <p className="hdec__plain">{pair.plain}</p>
      </div>

      <div className="hdec__tags">
        <span className="pepite">Grande entreprise</span>
        <span className="pepite">+50 % vs ton minimum</span>
        <span className="tag">3 j entreprise · 2 j école</span>
      </div>

      <div className="hdec__dots" aria-hidden="true">
        {PAIRS.map((_, n) => (
          <span key={n} className={n === i ? 'is-on' : ''} />
        ))}
      </div>
    </div>
  );
}
