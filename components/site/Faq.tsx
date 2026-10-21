'use client';

import { useState } from 'react';

const CARDS = [
  {
    tab: 'Garantie',
    q: 'Décode me trouve-t-il un contrat ?',
    a: 'Non. Décode t’aide à comprendre les offres et à viser les bonnes personnes. Personne ne peut garantir un contrat, nous non plus.',
  },
  {
    tab: 'Offres',
    q: 'D’où viennent les offres ?',
    a: 'De France Travail, mises à jour en continu, et des sites carrière des grandes entreprises. Tu postules toujours sur la page d’origine.',
  },
  {
    tab: 'Données',
    q: 'Qu’est-ce que vous gardez sur moi ?',
    a: 'Ton profil et ton suivi restent sur ton téléphone. Une offre collée part chez notre fournisseur d’IA pour être traduite, puis n’est pas gardée.',
  },
  {
    tab: 'Prix',
    q: 'C’est vraiment gratuit ?',
    a: 'Oui, pendant la bêta. Ensuite l’essentiel reste gratuit.',
  },
];

export function Faq() {
  const [open, setOpen] = useState(0);

  return (
    <section className="faq section" aria-labelledby="faq-title">
      <h2 id="faq-title" className="section-title faq__title" data-reveal>
        Tes questions
      </h2>
      <div className="faq__stack" data-reveal style={{ '--i': 1 } as React.CSSProperties}>
        {CARDS.map((card, i) => (
          <div key={card.tab} className={`faq__card faq__card--${(i % 3) + 1}${open === i ? ' is-open' : ''}`} style={{ '--n': i } as React.CSSProperties}>
            <span className="faq__tab">{card.tab}</span>
            <h3 className="faq__q">
              <button type="button" aria-expanded={open === i} aria-controls={`faq-${i}`} onClick={() => setOpen(i)}>
                {card.q}
              </button>
            </h3>
            <p id={`faq-${i}`} className="faq__a" hidden={open !== i}>
              {card.a}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
