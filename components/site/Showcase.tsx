'use client';

import { useState } from 'react';
import { formatEuros } from '@/lib/format';
import { SMIC } from '@/lib/rules/reference';
import { minimumSalary } from '@/lib/rules/salary';

const ITEMS = [
  { id: 'missions', name: 'Ce que tu feras', fact: 'Chaque info dit d’où elle vient : écrite, déduite ou inconnue.', field: 'var(--tint-6)' },
  { id: 'salaire', name: 'Ton salaire minimum', fact: 'Au centime, pour ton âge et ton année.', field: 'var(--tint-5)' },
  { id: 'rythme', name: 'Ton rythme', fact: 'Comparé à celui de ton école.', field: 'var(--surface)' },
  { id: 'pieges', name: 'Les pièges', fact: 'Les fausses offres d’écoles sont signalées.', field: 'var(--ink)' },
  { id: 'equipe', name: 'À qui écrire', fact: 'Le service à viser et un message prêt.', field: 'var(--tint-6)' },
] as const;

type ItemId = (typeof ITEMS)[number]['id'];

function SalaryLive() {
  const [age, setAge] = useState(21);
  const [year, setYear] = useState<1 | 2 | 3>(1);
  const m = minimumSalary({ contract: 'apprentissage', age, year, hasBacPro: false });
  return (
    <div className="ui-card show-frag" data-ui>
      <p className="ui-label">Ton salaire minimum en apprentissage</p>
      <p className="show-frag__figure num" aria-live="polite">
        {formatEuros(m.cents)}
        <span className="ui-unit"> brut par mois</span>
      </p>
      <p className="ui-meta">
        {m.rate} % du SMIC · {m.bracket} · {year}
        {year === 1 ? 're' : 'e'} année
      </p>
      <div className="show-frag__controls">
        <div className="ui-field">
          <span className="ui-label" id="age-label">
            Ton âge
          </span>
          <div className="ui-stepper" role="group" aria-labelledby="age-label">
            <button type="button" aria-label="Un an de moins" onClick={() => setAge((a) => Math.max(16, a - 1))}>
              −
            </button>
            <span className="num">{age} ans</span>
            <button type="button" aria-label="Un an de plus" onClick={() => setAge((a) => Math.min(30, a + 1))}>
              +
            </button>
          </div>
        </div>
        <div className="ui-field">
          <span className="ui-label" id="year-label">
            Année de contrat
          </span>
          <div className="ui-segmented" role="group" aria-labelledby="year-label">
            {([1, 2, 3] as const).map((y) => (
              <button key={y} type="button" aria-pressed={year === y} onClick={() => setYear(y)}>
                {y}
                {y === 1 ? 're' : 'e'}
              </button>
            ))}
          </div>
        </div>
      </div>
      <p className="ui-source">SMIC au {new Date(SMIC.since).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
    </div>
  );
}

const WEEK = [
  { day: 'Lun', where: 'Entreprise' },
  { day: 'Mar', where: 'Entreprise' },
  { day: 'Mer', where: 'Entreprise' },
  { day: 'Jeu', where: 'École' },
  { day: 'Ven', where: 'École' },
];

function Fragment({ id }: { id: ItemId }) {
  if (id === 'salaire') return <SalaryLive />;
  if (id === 'missions')
    return (
      <div className="ui-card show-frag" data-ui>
        <p className="ui-label">Ta semaine probable · Chargé d’études marketing</p>
        <ol className="ui-week-list">
          <li>
            <span>Lundi matin</span>Point d’équipe et mise à jour du tableau des chiffres
          </li>
          <li>
            <span>Lundi après-midi</span>Tri des résultats d’une enquête dans Excel
          </li>
          <li>
            <span>Mardi</span>Réunion avec un institut d’études
          </li>
          <li>
            <span>Mercredi</span>Veille concurrentielle et slides de synthèse
          </li>
        </ol>
        <p className="ui-certainty">
          <span className="ui-chip ui-chip--deduit">Déduit</span> de quatre missions écrites dans l’annonce
        </p>
      </div>
    );
  if (id === 'rythme')
    return (
      <div className="ui-card show-frag" data-ui>
        <p className="ui-label">Rythme de l’offre comparé à ton école</p>
        <div className="ui-weekstrip">
          {WEEK.map((d) => (
            <div key={d.day} className={d.where === 'École' ? 'is-school' : 'is-company'}>
              <span className="ui-weekstrip__day">{d.day}</span>
              <span className="ui-weekstrip__where">{d.where}</span>
            </div>
          ))}
        </div>
        <p className="ui-status ui-status--ok">Compatible : ton école est en 3 jours / 2 jours</p>
      </div>
    );
  if (id === 'pieges')
    return (
      <div className="ui-card show-frag" data-ui>
        <p className="ui-label">Assistant RH en alternance · Lyon 3e</p>
        <p className="ui-alert-title">Offre d’école déguisée</p>
        <ul className="ui-reasons">
          <li>L’annonceur est une école, l’entreprise n’est pas nommée.</li>
          <li>Elle parle de frais de dossier.</li>
          <li>Elle annonce une rentrée, pas une embauche.</li>
        </ul>
        <p className="ui-meta">Question à poser : « Quel est le nom de l’entreprise qui recrute ? »</p>
      </div>
    );
  return (
    <div className="ui-card show-frag" data-ui>
      <p className="ui-label">Trouver l’équipe · Marketing Insights</p>
      <ul className="ui-roles">
        <li>Alternante en marketing insights</li>
        <li>Chargé d’études marketing</li>
        <li>Responsable études</li>
      </ul>
      <p className="ui-query">« Orvane » insights alternant</p>
      <p className="ui-message">
        Bonjour, je suis Inès, en master marketing. Vous qui êtes dans l’équipe Insights : qu’est-ce qui fait qu’un alternant y
        réussit sa première année ?
      </p>
    </div>
  );
}

export function Showcase() {
  const [selected, setSelected] = useState<ItemId>('salaire');
  const item = ITEMS.find((i) => i.id === selected) ?? ITEMS[0];

  return (
    <section className="showcase" aria-labelledby="showcase-title">
      <div className="showcase__stage">
        <div className="showcase__shape stroke" style={{ background: item.field }} aria-hidden="true" />
        <div className="showcase__object" key={item.id}>
          <Fragment id={item.id} />
        </div>
      </div>
      <div className="showcase__list">
        <h2 id="showcase-title" className="showcase__heading">
          Ce qu’on lit pour toi
        </h2>
        <ul role="list">
          {ITEMS.map((i) => (
            <li key={i.id}>
              <button type="button" aria-pressed={i.id === selected} onClick={() => setSelected(i.id)}>
                {i.name}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <p className="showcase__fact">{item.fact}</p>
    </section>
  );
}
