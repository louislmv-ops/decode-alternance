const CARDS = [
  {
    tab: 'Garantie',
    q: 'Décode me trouve-t-il un contrat ?',
    a: 'Non. Décode t’aide à comprendre les offres et à viser les bonnes personnes. Personne ne peut garantir un contrat, nous non plus.',
  },
  {
    tab: 'Offres',
    q: 'D’où viennent les offres ?',
    a: 'De France Travail, à jour en continu. Tu postules toujours sur la page d’origine de l’offre.',
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
  return (
    <section className="faq band" aria-labelledby="faq-title">
      <h2 id="faq-title" className="section-title" data-reveal>
        Tes questions
      </h2>
      <div className="faq__list">
        {CARDS.map((card, i) => (
          <details key={card.tab} className="faq__item" open={i === 0} data-reveal style={{ '--i': i } as React.CSSProperties}>
            <summary className="faq__q">{card.q}</summary>
            <p className="faq__a">{card.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
