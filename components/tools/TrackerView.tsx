'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CopyButton } from '@/components/offer/CopyButton';
import { useProfile } from '@/components/useProfile';
import { useTracker } from '@/components/useTracker';
import { TrackerCharts } from './TrackerCharts';
import { AccountNudge } from '@/components/account/AccountNudge';
import { formatDate } from '@/lib/format';
import { followUpMessage } from '@/lib/linkedin';
import { CHANNELS, daysSince, followUpDate, isFollowUpDue, moveTo, stats, todayIso, type Channel } from '@/lib/tracker';
import { KanbanBoard } from './KanbanBoard';

const channelLabel = (c: Channel) => CHANNELS.find((x) => x.value === c)?.label ?? c;

const EMPTY_FORM = { company: '', title: '', url: '', channel: 'offre' as Channel };

export function TrackerView() {
  const { apps, add, update, remove } = useTracker();
  const [profile] = useProfile();
  const [form, setForm] = useState(EMPTY_FORM);
  const today = todayIso();
  const due = apps.filter((a) => isFollowUpDue(a, today));
  const s = stats(apps);

  return (
    <div className="screen">
      <div className="title-row">
        <div>
          <h1>Mon suivi</h1>
          <p className="title-row__sub">
            {apps.length === 0
              ? 'Qui relancer, ce qui marche.'
              : due.length > 0
                ? `${due.length} relance${due.length > 1 ? 's' : ''} à faire aujourd’hui · ${s.sent} candidature${s.sent > 1 ? 's' : ''} envoyée${s.sent > 1 ? 's' : ''}`
                : `Aucune relance à faire aujourd’hui · ${s.sent} candidature${s.sent > 1 ? 's' : ''} envoyée${s.sent > 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      <AccountNudge />

      <div className="tracker">
        <section className="panel tracker__due" aria-labelledby="due-title">
          <div className="panel__head">
            <h2 id="due-title">À relancer</h2>
            <span className="panel__meta">après 7 jours</span>
          </div>
          {due.length === 0 ? (
            <p className="empty">
              {apps.some((a) => a.status === 'envoyee')
                ? `Prochaine relance le ${formatDate(apps.map(followUpDate).filter((d): d is string => Boolean(d)).sort()[0] ?? today)}.`
                : 'Rien à relancer.'}
            </p>
          ) : (
            <ul className="due-list" role="list">
              {due.map((a) => (
                <li key={a.id}>
                  <div>
                    <p className="due-list__name">{a.company}</p>
                    <p className="due-list__meta">
                      {a.title} · envoyée il y a {daysSince(a.sentAt ?? today, today)} jours · {channelLabel(a.channel)}
                    </p>
                  </div>
                  <div className="due-list__actions">
                    <CopyButton text={followUpMessage({ firstName: profile.firstName, company: a.company })} label="Copier la relance" />
                    <button type="button" className="ui-btn ui-btn--small ui-btn--primary" onClick={() => update(a.id, { status: 'relancee', followedUpAt: today })}>
                      C’est relancé
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel tracker__stats" aria-labelledby="stats-title">
          <div className="panel__head">
            <h2 id="stats-title">Ce qui marche pour toi</h2>
          </div>
          <div className="kpis">
            <div>
              <p className="ui-label">Envoyées</p>
              <p className="kpi num">{s.sent}</p>
            </div>
            <div>
              <p className="ui-label">Réponses</p>
              <p className="kpi num">{s.answered}</p>
            </div>
            <div>
              <p className="ui-label">Entretiens</p>
              <p className="kpi num">{s.interviews}</p>
            </div>
            <div>
              <p className="ui-label">Taux de réponse</p>
              <p className="kpi num">{s.answerRate === null ? '–' : `${s.answerRate} %`}</p>
            </div>
          </div>
        </section>
      </div>

      <TrackerCharts apps={apps} today={today} />

      <section className="panel" aria-labelledby="all-title">
        <div className="panel__head">
          <h2 id="all-title">Mes candidatures</h2>
          <span className="panel__meta num">{apps.length}</span>
        </div>

        <form
          className="add-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.company.trim()) return;
            add({ ...form, url: /^https?:\/\//.test(form.url) ? form.url : '', status: 'a-envoyer', sentAt: null, followedUpAt: null, notes: '' });
            setForm(EMPTY_FORM);
          }}
        >
          <label className="ui-field">
            <span className="ui-label">Entreprise</span>
            <input className="ui-input" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} required />
          </label>
          <label className="ui-field">
            <span className="ui-label">Poste</span>
            <input className="ui-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </label>
          <label className="ui-field">
            <span className="ui-label">Canal</span>
            <select className="ui-select" value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value as Channel })}>
              {CHANNELS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="ui-field">
            <span className="ui-label">Lien (facultatif)</span>
            <input className="ui-input" type="url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://" />
          </label>
          <button type="submit" className="ui-btn ui-btn--primary">
            Ajouter
          </button>
        </form>

        {apps.length === 0 ? (
          <p className="empty">
            Rien pour l’instant. Ajoute-en une, ou garde une <Link href="/offres/swipe">offre au swipe</Link> : elle arrive dans « À postuler ».
          </p>
        ) : (
          <KanbanBoard apps={apps} today={today} onMove={(id, column) => {
            const app = apps.find((a) => a.id === id);
            if (app) update(id, moveTo(app, column, today));
          }} onRemove={remove} />
        )}
      </section>
    </div>
  );
}
