'use client';

import { useState } from 'react';

const CARDS = [
  {
    tab: 'Garantie',
    q: 'Décode me trouve-t-il un contrat ?',
    a: 'Non. Décode t’aide à comprendre les offres, à viser les bonnes personnes et à t’organiser. Personne ne peut te garantir un contrat, un entretien ou une réponse, et nous non plus.',
  },
  {
    tab: 'Offres',
    q: 'D’où viennent les offres ?',
    a: 'De l’API de France Travail, dont la licence autorise la rediffusion, et des sites carrière de grandes entreprises, lus dans le format public qu’elles publient pour les moteurs de recherche. Chaque offre renvoie vers sa page d’origine pour postuler. Tu peux aussi coller une offre trouvée n’importe où.',
  },
  {
    tab: 'IA',
    q: 'L’IA peut-elle se tromper ?',
    a: 'Oui. C’est pour ça que chaque information dit d’où elle vient : écrite dans l’annonce, déduite, ou inconnue. Quand un point compte et reste flou, Décode te donne la question à poser au recruteur.',
  },
  {
    tab: 'Données',
    q: 'Qu’est-ce que vous gardez sur moi ?',
    a: 'Ton profil et ton suivi restent dans ton navigateur, pas sur nos serveurs. Une offre que tu colles est envoyée à notre fournisseur d’IA pour être traduite, puis Décode ne la garde pas.',
  },
  {
    tab: 'LinkedIn',
    q: 'Vous contactez les gens à ma place ?',
    a: 'Non. Décode te donne les recherches à lancer et un message à adapter. C’est toi qui cherches et qui écris : c’est plus efficace qu’un envoi en masse, et c’est la règle sur LinkedIn.',
  },
  {
    tab: 'Prix',
    q: 'C’est vraiment gratuit ?',
    a: 'Oui, tout est gratuit pendant la bêta. Ensuite, l’essentiel restera gratuit et un Pass Saison à petit prix ajoutera des outils.',
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
