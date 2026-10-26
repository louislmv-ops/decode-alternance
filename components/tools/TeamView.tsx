'use client';

import { useState } from 'react';
import { IconOut } from '@/components/app/Icons';
import { CopyButton } from '@/components/offer/CopyButton';
import { useProfile } from '@/components/useProfile';
import { connectionMessage, followUpMessage, MESSAGE_MAX, teamSearches } from '@/lib/linkedin';

const STEPS = [
  {
    title: 'Trouve le service, pas seulement l’entreprise',
    text: '« Assistant contrôle de gestion » = l’équipe finance. C’est elle qu’il faut viser.',
  },
  {
    title: 'Commence par un alternant',
    text: 'Un alternant du service répond plus souvent qu’un recruteur.',
  },
  {
    title: 'Pose une vraie question',
    text: 'Pas « tu me recommandes ? ». Une vraie question sur le poste.',
  },
  {
    title: 'Postule par le canal officiel',
    text: 'Postule quand même sur le site de l’entreprise.',
  },
  {
    title: 'Relance une fois',
    text: 'Pas de réponse en 7 jours ? Une relance, pas deux.',
  },
];

export function TeamView({ initial }: { initial: { company: string; service: string; city: string } }) {
  const [profile] = useProfile();
  const [company, setCompany] = useState(initial.company);
  const [service, setService] = useState(initial.service);
  const [city, setCity] = useState(initial.city);
  const [school, setSchool] = useState<string | null>(null);
  const schoolValue = school ?? profile.school;

  const searches = teamSearches({ company, service, city, school: schoolValue });
  const message = connectionMessage({ company, service, city, school: schoolValue, firstName: profile.firstName, formation: profile.school });
  const relance = followUpMessage({ firstName: profile.firstName, company });

  return (
    <div className="screen">
      <div className="title-row">
        <div>
          <h1>Trouver l’équipe</h1>
          <p className="title-row__sub">Les bonnes personnes à contacter, et quoi leur écrire.</p>
        </div>
      </div>

      <section className="panel" aria-labelledby="target-title">
        <div className="panel__head">
          <h2 id="target-title">Ta cible</h2>
        </div>
        <div className="team-form">
          <label className="ui-field">
            <span className="ui-label">Entreprise</span>
            <input className="ui-input" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Ex. Kerlog Solutions" />
          </label>
          <label className="ui-field">
            <span className="ui-label">Service ou métier</span>
            <input className="ui-input" value={service} onChange={(e) => setService(e.target.value)} placeholder="Ex. contrôle de gestion" />
          </label>
          <label className="ui-field">
            <span className="ui-label">Ville</span>
            <input className="ui-input" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ex. Rennes" />
          </label>
          <label className="ui-field">
            <span className="ui-label">Ton école</span>
            <input className="ui-input" value={schoolValue} onChange={(e) => setSchool(e.target.value)} placeholder="Ex. IUT de Lannion" />
          </label>
        </div>
      </section>

      <div className="team">
        <section className="panel" aria-labelledby="searches-title">
          <div className="panel__head">
            <h2 id="searches-title">Les recherches, dans l’ordre</h2>
            <span className="panel__meta">Elles s’ouvrent avec ton compte</span>
          </div>
          {searches.length === 0 ? (
            <p className="empty">Indique une entreprise pour obtenir tes recherches.</p>
          ) : (
            <ol className="search-steps">
              {searches.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="search-link">
                    <span>{s.label}</span>
                    <IconOut />
                  </a>
                  <p className="search-steps__why">{s.why}</p>
                  <p className="search-steps__query">{s.query}</p>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="panel" aria-labelledby="msg-title">
          <div className="panel__head">
            <h2 id="msg-title">Les messages</h2>
          </div>
          <p className="ui-label">Le premier message</p>
          <div className="message">
            <p className="message__text">{message}</p>
            <div className="message__foot">
              <span className={`num${message.length > MESSAGE_MAX ? ' is-over' : ''}`}>
                {message.length} / {MESSAGE_MAX}
              </span>
              <CopyButton text={message} label="Copier" />
            </div>
          </div>
          <p className="ui-label msg-gap">La relance, une semaine après</p>
          <div className="message">
            <p className="message__text">{relance}</p>
            <div className="message__foot">
              <span className="num">{relance.length} caractères</span>
              <CopyButton text={relance} label="Copier" />
            </div>
          </div>
        </section>
      </div>

      <details className="panel fold" aria-labelledby="method-title">
        <summary className="panel__head fold__head">
          <h2 id="method-title">La méthode</h2>
        </summary>
        <ol className="method">
          {STEPS.map((s) => (
            <li key={s.title}>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
      </details>
    </div>
  );
}
