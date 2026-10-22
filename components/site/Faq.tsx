import type { OfferPage } from '@/lib/offers/types';

const SOURCES: Record<OfferPage['mode'], string> = {
  exemples:
    'Pour l’instant, ce sont des exemples fictifs : les vraies offres de France Travail arrivent dès que l’accès est validé. Tu peux déjà coller n’importe quelle offre trouvée ailleurs.',
  direct: 'De France Travail, interrogé à chaque recherche : tu vois les offres du jour. Tu postules toujours sur la page d’origine de l’offre.',
  base: 'De France Travail et des sites carrière des entreprises, mis à jour chaque nuit. Tu postules toujours sur la page d’origine de l’offre.',
};

const CARDS = [
  {
    tab: 'Garantie',
    q: 'Décode me trouve-t-il un contrat ?',
    a: 'Non. Décode t’aide à comprendre les offres et à viser les bonnes personnes. Personne ne peut garantir un contrat, nous non plus.',
  },
  {
    tab: 'Offres',
    q: 'D’où viennent les offres ?',
    a: '',
  },
  {
    tab: 'Données',
    q: 'Qu’est-ce que vous gardez sur moi ?',
    a: 'Ton profil et ton suivi restent sur ton téléphone. Une offre collée part chez notre fournisseur d’IA pour être traduite, puis n’est pas gardée.',
  },
  {
    tab: 'Prix',
    q: 'C’est vraiment gratuit ?',
    a: 'Oui. Les offres et leur décodage sont gratuits, et les alertes le seront aussi quand elles arriveront. Plus tard, un Pass optionnel pourra ajouter des extras comme un simulateur d’entretien.',
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
