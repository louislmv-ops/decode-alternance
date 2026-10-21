'use client';

import { useState } from 'react';

const STAGES = [
  {
    name: 'Trouver',
    text: 'Les offres de France Travail et celles des sites carrière des grands groupes, au même endroit et sans les doublons. Et n’importe quelle autre offre, que tu colles.',
  },
  {
    name: 'Comprendre',
    text: 'Chaque offre traduite en phrases simples : ce que tu feras, une semaine probable, ce que tu vas apprendre et ce que l’annonce ne dit pas.',
  },
  {
    name: 'Vérifier',
    text: 'Ton salaire minimum calculé pour ton âge, le rythme comparé à celui de ton école, les fausses offres d’écoles signalées en rouge.',
  },
  {
    name: 'Contacter',
    text: 'Le service à viser, les postes à chercher sur LinkedIn, les questions à poser et un message court à adapter.',
  },
  {
    name: 'Relancer',
    text: 'Ton suivi te dit qui relancer et quand. Une relance, au bon moment, pas cinq.',
  },
  {
    name: 'Mesurer',
    text: 'Tu vois ce qui t’apporte des réponses : les offres, les candidatures spontanées ou les messages. Tu gardes ce qui marche.',
  },
];

export function Journey() {
  const [open, setOpen] = useState(0);

  return (
    <section className="journey section" aria-labelledby="journey-title">
      <div className="journey__intro">
        <h2 id="journey-title" className="section-title" data-reveal>
          Le parcours en entier
        </h2>
        <p className="journey__lead" data-reveal style={{ '--i': 1 } as React.CSSProperties}>
          Chercher une alternance, ce n’est pas seulement trouver des annonces. Décode t’accompagne de la lecture de l’offre jusqu’au
          message qui te fait remarquer, puis jusqu’à la relance.
        </p>
      </div>
      <div className="journey__row" data-reveal style={{ '--i': 2 } as React.CSSProperties}>
        {STAGES.map((stage, i) => (
          <div key={stage.name} className={`journey__panel journey__panel--${i + 1}${open === i ? ' is-open' : ''}`}>
            <button
              type="button"
              className="journey__toggle"
              aria-expanded={open === i}
              aria-controls={`journey-${i}`}
              onClick={() => setOpen(i)}
            >
              <span className="journey__name">{stage.name}</span>
            </button>
            <div id={`journey-${i}`} className="journey__body" hidden={open !== i}>
              <p className="journey__open-name">{stage.name}</p>
              <p className="journey__text">{stage.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
