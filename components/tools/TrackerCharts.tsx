'use client';

import { useState } from 'react';
import { CHANNELS, funnel, observations, stats, weekly, type Application } from '@/lib/tracker';

const SHORT: Record<string, string> = { offre: 'Offre', spontanee: 'Spontanée', linkedin: 'LinkedIn', reseau: 'Réseau' };

const shortDate = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', timeZone: 'Europe/Paris' });

/** Les envois des 8 dernières semaines : touche une barre pour le détail. */
function WeeklyChart({ apps, today }: { apps: Application[]; today: string }) {
  const bars = weekly(apps, today);
  const max = Math.max(1, ...bars.map((b) => b.sent));
  const [active, setActive] = useState(bars.length - 1);
  const current = bars[active]!;
  return (
    <figure className="tchart">
      <figcaption className="tchart__head">
        <span>Envois par semaine</span>
        <span className="tchart__value num">
          {current.sent} <small>sem. du {shortDate(current.start)}</small>
        </span>
      </figcaption>
      <div className="tchart__bars" role="list">
        {bars.map((b, i) => (
          <button
            key={b.start}
            type="button"
            role="listitem"
            className={`tchart__col${i === active ? ' is-active' : ''}`}
            onMouseEnter={() => setActive(i)}
            onFocus={() => setActive(i)}
            onClick={() => setActive(i)}
            aria-label={`Semaine du ${shortDate(b.start)} : ${b.sent} envoi${b.sent > 1 ? 's' : ''}`}
          >
            <span className="tchart__bar" style={{ height: `${b.sent === 0 ? 0 : Math.max(6, (b.sent / max) * 100)}%` }} />
            <span className="tchart__tick">{i === bars.length - 1 ? 'Cette sem.' : i === 0 || i === 3 ? shortDate(b.start) : ''}</span>
          </button>
        ))}
      </div>
    </figure>
  );
}

/** De l'ajout à la signature, chaque étape en barre, avec la part de l'étape d'avant. */
function Funnel({ apps }: { apps: Application[] }) {
  const steps = funnel(apps);
  const max = Math.max(1, steps[0]!.count);
  const [active, setActive] = useState<number | null>(null);
  return (
    <figure className="tchart">
      <figcaption className="tchart__head">
        <span>Ton entonnoir</span>
      </figcaption>
      <ul className="tfunnel" role="list">
        {steps.map((s, i) => {
          const prev = i > 0 ? steps[i - 1]!.count : null;
          const rate = prev ? Math.round((s.count / prev) * 100) : null;
          return (
            <li key={s.label}>
              <button
                type="button"
                className={`tfunnel__row${active === i ? ' is-active' : ''}`}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                onClick={() => setActive(active === i ? null : i)}
              >
                <span className="tfunnel__label">{s.label}</span>
                <span className="tfunnel__track">
                  <span className="tfunnel__bar" style={{ width: `${s.count === 0 ? 0 : Math.max(3, (s.count / max) * 100)}%` }} />
                </span>
                <span className="tfunnel__n num">
                  {s.count}
                  {active === i && rate !== null && <small> · {rate} %</small>}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </figure>
  );
}

/** Le taux de réponse (ou d'entretien) par canal. */
function Channels({ apps }: { apps: Application[] }) {
  const [metric, setMetric] = useState<'answered' | 'interviews'>('answered');
  const rows = stats(apps).byChannel;
  return (
    <figure className="tchart">
      <figcaption className="tchart__head">
        <span>Par canal</span>
        <span className="tchart__seg" role="group" aria-label="Mesure">
          <button type="button" aria-pressed={metric === 'answered'} onClick={() => setMetric('answered')}>
            Réponses
          </button>
          <button type="button" aria-pressed={metric === 'interviews'} onClick={() => setMetric('interviews')}>
            Entretiens
          </button>
        </span>
      </figcaption>
      <ul className="tfunnel" role="list">
        {rows.map((c) => {
          const rate = c.sent === 0 ? null : Math.round((c[metric] / c.sent) * 100);
          return (
            <li key={c.channel} className="tfunnel__row tfunnel__row--static">
              <span className="tfunnel__label" title={CHANNELS.find((x) => x.value === c.channel)!.label}>
                {SHORT[c.channel]}
              </span>
              <span className="tfunnel__track">
                <span className="tfunnel__bar" style={{ width: `${rate ? Math.max(3, rate) : 0}%` }} />
              </span>
              <span className="tfunnel__n num">
                {rate === null ? '–' : `${rate} %`} <small>sur {c.sent}</small>
              </span>
            </li>
          );
        })}
      </ul>
    </figure>
  );
}

export function TrackerCharts({ apps, today }: { apps: Application[]; today: string }) {
  if (apps.length === 0) return null;
  const notes = observations(apps, today);
  return (
    <section className="panel tracker__charts" aria-labelledby="charts-title">
      <div className="panel__head">
        <h2 id="charts-title">Tes stats</h2>
      </div>
      {notes.length > 0 && (
        <ul className="tnotes" role="list">
          {notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      )}
      <div className="tcharts">
        <WeeklyChart apps={apps} today={today} />
        <Funnel apps={apps} />
        <Channels apps={apps} />
      </div>
    </section>
  );
}
