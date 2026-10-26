import type { OfferPage } from '@/lib/offers/types';

const SOURCES: Record<OfferPage['mode'], string> = {
  exemples:
    'Pour l’instant, des exemples fictifs. Les vraies offres de France Travail arrivent très vite.',
  direct: 'De France Travail, à jour. Tu postules sur la page d’origine.',
  base: 'De France Travail et des sites carrière, à jour chaque nuit.',
};

const CARDS = [
  {
    tab: 'Garantie',
    q: 'Décode me trouve-t-il un contrat ?',
    a: 'Non. Personne ne peut le garantir. Décode t’aide à viser juste.',
  },
  {
    tab: 'Offres',
    q: 'D’où viennent les offres ?',
    a: '',
  },
  {
    tab: 'Données',
    q: 'Qu’est-ce que vous gardez sur moi ?',
    a: 'Le strict minimum. Ton profil reste sur ton téléphone, sauf si tu crées un compte.',
  },
  {
    tab: 'Prix',
    q: 'C’est vraiment gratuit ?',
    a: 'Oui. Offres, décodage et alertes. Un Pass optionnel pourra ajouter des extras plus tard.',
  },
];

export function Faq({ mode }: { mode: OfferPage['mode'] }) {
  return (
    <section className="faq band" aria-labelledby="faq-title">
      <h2 id="faq-title" className="section-title" data-reveal>
        Tes questions
      </h2>
      <div className="faq__list">
        {CARDS.map((card, i) => (
          <details key={card.tab} className="faq__item" open={i === 0} data-reveal style={{ '--i': i } as React.CSSProperties}>
            <summary className="faq__q">{card.q}</summary>
            <p className="faq__a">{card.tab === 'Offres' ? SOURCES[mode] : card.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
