'use client';

import Link from 'next/link';
import { useState } from 'react';

const CONTACT = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

const PLANS = [
  {
    id: 'gratuit',
    name: 'Gratuit',
    price: '0 €',
    period: 'pour toujours',
    text: 'Les offres, leur traduction, ton salaire minimum, LinkedIn et ton suivi.',
    action: { label: 'Commencer gratuitement', href: '/decoder' },
  },
  {
    id: 'pass',
    name: 'Pass Saison',
    price: '9,99 €',
    period: 'pour 3 mois, sans renouvellement',
    text: 'Après la bêta : alertes pépites, comparaison d’offres, statistiques. Rien n’est facturé aujourd’hui.',
    action: { label: 'Essayer pendant la bêta', href: '/decoder' },
  },
  {
    id: 'ecoles',
    name: 'Écoles',
    price: 'Sur devis',
    period: 'pour les CFA et les écoles',
    text: 'Décode pour tous tes étudiants, avec un suivi de leur recherche.',
    action: CONTACT ? { label: 'Écrire à l’équipe', href: `mailto:${CONTACT}?subject=${encodeURIComponent('Décode pour notre école')}` } : null,
  },
] as const;

export function Pricing() {
  const [selected, setSelected] = useState<(typeof PLANS)[number]['id']>('pass');
  const plan = PLANS.find((p) => p.id === selected) ?? PLANS[1];

  return (
    <section className="pricing section" aria-label="Prix">
      <div className="pricing__names" role="tablist" aria-label="Formules">
        {PLANS.map((p) => (
          <div key={p.id} className="pricing__item">
            <button
              type="button"
              role="tab"
              id={`plan-${p.id}`}
              aria-selected={p.id === selected}
              aria-controls="plan-stage"
              className="pricing__name"
              onClick={() => setSelected(p.id)}
              onFocus={() => setSelected(p.id)}
            >
              {p.name}
            </button>
            {p.id === selected && (
              <div className="pricing__stage pricing__stage--phone">
                <PlanStage plan={p} />
              </div>
            )}
          </div>
        ))}
      </div>
      <div id="plan-stage" className="pricing__stage pricing__stage--desktop" role="tabpanel" aria-labelledby={`plan-${plan.id}`}>
        <PlanStage plan={plan} key={plan.id} />
      </div>
    </section>
  );
}

function PlanStage({ plan }: { plan: (typeof PLANS)[number] }) {
  return (
    <div className="pricing__content">
      <p className="pricing__price">
        <span className="num">{plan.price}</span>
        <span className="pricing__period">{plan.period}</span>
      </p>
      <p className="pricing__text">{plan.text}</p>
      {plan.action ? (
        plan.action.href.startsWith('mailto:') ? (
          <a className="btn" href={plan.action.href}>
            {plan.action.label}
          </a>
        ) : (
          <Link className="btn" href={plan.action.href}>
            {plan.action.label}
          </Link>
        )
      ) : (
        <button type="button" className="btn" disabled>
          Contact bientôt
        </button>
      )}
    </div>
  );
}
