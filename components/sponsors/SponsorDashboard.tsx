'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { call, type PublicMember } from '@/components/community/ui';
import { Candidate } from '@/components/recruiters/RecruiterApp';
import { goTo } from './SponsorBox';

type Dashboard = {
  company: string;
  verified: boolean;
  sponsor: { active: boolean; status: string | null; periodEnd: string | null; cancelAtPeriodEnd: boolean; billing: boolean };
  stats: { day: string; impressions: number; clicks: number }[];
  candidates: (PublicMember & { liked: string[] })[];
};

const day = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', timeZone: 'Europe/Paris' }).replace(/^1 /, '1er ') : '';

const num = (n: number) => n.toLocaleString('fr-FR');

/** Le tableau de bord de la mise en avant : l'abonnement, les vues et clics des 30 derniers jours, les alternants intéressés. */
export function SponsorDashboard({ justPaid }: { justPaid: boolean }) {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    call<Dashboard>('/api/pro/tableau')
      .then(setData)
      .catch((err: Error) => setError(err.message));
  }, []);

  async function go(url: string) {
    setBusy(true);
    setError(null);
    try {
      await goTo(url);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  if (error && !data) {
    return (
      <div className="c-cta">
        <p>
          <strong>{error}</strong>
        </p>
        <Link href="/recruteur" className="btn btn--small">
          Espace entreprise
        </Link>
      </div>
    );
  }
  if (!data) return <p className="c-empty">Chargement…</p>;

  const s = data.sponsor;
  const views = data.stats.reduce((n, d) => n + d.impressions, 0);
  const clicks = data.stats.reduce((n, d) => n + d.clicks, 0);
  const max = Math.max(1, ...data.stats.map((d) => d.impressions));

  return (
    <div className="pro">
      <h1 className="pro__title">{data.company}</h1>
      {justPaid && <p className="c-note">Merci ! Ta mise en avant démarre dès que Stripe confirme le paiement, en général en quelques secondes.</p>}

      <div className="pro__box">
        {!data.verified ? (
          <p>On vérifie encore ton entreprise. La mise en avant s’ouvre dès que c’est fait.</p>
        ) : s.active ? (
          <p>
            {s.cancelAtPeriodEnd
              ? `Mise en avant résiliée : tes offres restent en tête jusqu’au ${day(s.periodEnd)}.`
              : `Mise en avant active. Prochain renouvellement le ${day(s.periodEnd)}.`}
          </p>
        ) : (
          <p>Tes offres ne sont pas mises en avant en ce moment.</p>
        )}
        {s.status === 'past_due' && <p className="c-note c-note--error">Le dernier paiement a échoué. Mets à jour ta carte pour continuer.</p>}
        <div className="pro__actions">
          {data.verified && !s.active && (
            <button type="button" className="btn" disabled={busy} onClick={() => go('/api/pro/abonnement')}>
              Mettre mes offres en avant
            </button>
          )}
          {s.billing && (
            <button type="button" className="ui-btn" disabled={busy} onClick={() => go('/api/pro/portail')}>
              Factures et résiliation
            </button>
          )}
        </div>
        {error && <p className="c-note c-note--error">{error}</p>}
      </div>

      <section className="sdash__stats" aria-label="Vues et clics des 30 derniers jours">
        <h2>30 derniers jours</h2>
        <dl className="sdash__kpis">
          <div>
            <dt>Vues</dt>
            <dd className="num">{num(views)}</dd>
          </div>
          <div>
            <dt>Clics</dt>
            <dd className="num">{num(clicks)}</dd>
          </div>
          <div>
            <dt>Taux de clic</dt>
            <dd className="num">{views ? `${((clicks / views) * 100).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %` : '–'}</dd>
          </div>
        </dl>
        {views > 0 ? (
          <ol className="sdash__bars" role="list">
            {data.stats.map((d) => (
              <li key={d.day} title={`${day(d.day)} : ${num(d.impressions)} vues, ${num(d.clicks)} clics`}>
                <span style={{ height: d.impressions ? `${Math.max(4, (d.impressions / max) * 100)}%` : '2px' }} />
              </li>
            ))}
          </ol>
        ) : (
          <p className="c-empty">Les vues apparaîtront ici dès que tes offres seront montrées.</p>
        )}
        <p className="pro__small">Une vue : l’offre a été affichée à l’écran. Un clic : elle a été ouverte. Aucune donnée sur les personnes.</p>
      </section>

      <section className="sdash__people">
        <h2>Alternants intéressés</h2>
        <p className="pro__small">Ils ont aimé une de tes offres et ont accepté que tu voies leur profil. Tu leur écris depuis Décode, sans voir leur e-mail.</p>
        {!s.active ? (
          <p className="c-empty">Réservé aux entreprises dont la mise en avant est active.</p>
        ) : data.candidates.length === 0 ? (
          <p className="c-empty">Personne pour l’instant. Ça arrive quand un alternant aime une de tes offres et l’accepte.</p>
        ) : (
          <div className="r-results">
            {data.candidates.map((m) => (
              <Candidate key={m.handle} member={m} liked={m.liked} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
