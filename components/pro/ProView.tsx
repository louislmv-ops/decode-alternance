'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { PRO_FEATURES, type ProState, TRIAL_DAYS } from '@/lib/pro/plan';

type Info = { available: boolean; price: string | null; signedIn: boolean; state: ProState | null };

const FREE = ['Toutes les offres et les filtres', 'Décoder une offre', 'Avis et salaires', 'La commu', 'Le suivi de tes candidatures', 'Les alertes e-mail du matin'];

const day = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', timeZone: 'Europe/Paris' }).replace(/^1 /, '1er ') : '';

async function post<T>(url: string): Promise<T> {
  const res = await fetch(url, { method: 'POST' });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(data.error ?? 'Une erreur est survenue.');
  return data;
}

export function ProView({ justPaid }: { justPaid: boolean }) {
  const [info, setInfo] = useState<Info | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () =>
    fetch('/api/pro')
      .then((r) => (r.ok ? r.json() : { available: false, price: null, signedIn: false, state: null }))
      .then(setInfo)
      .catch(() => setInfo({ available: false, price: null, signedIn: false, state: null }));

  useEffect(() => {
    fetch('/api/pro')
      .then((r) => (r.ok ? r.json() : { available: false, price: null, signedIn: false, state: null }))
      .then(setInfo)
      .catch(() => setInfo({ available: false, price: null, signedIn: false, state: null }));
  }, []);

  async function act(fn: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const go = (url: string) => act(async () => void (window.location.href = (await post<{ url: string }>(url)).url));

  const s = info?.state;
  const subscribed = Boolean(s?.status && ['active', 'trialing', 'past_due'].includes(s.status));
  const inTrial = Boolean(s?.trialUntil && new Date(s.trialUntil) > new Date());

  return (
    <div className="pro">
      <h1 className="pro__title">
        Décode <span>Pro</span>
      </h1>
      <p className="pro__lead">Le gratuit fait déjà tout. Pro va plus vite.</p>

      <ul className="pro__features" role="list">
        {PRO_FEATURES.map(([title, text]) => (
          <li key={title}>
            <strong>{title}</strong>
            <span>{text}</span>
          </li>
        ))}
      </ul>

      <div className="pro__box">
        {info === null ? (
          <p className="c-empty">Chargement…</p>
        ) : !info.available ? (
          <p className="pro__price">Bientôt disponible.</p>
        ) : (
          <>
            <p className="pro__price">
              <strong>{TRIAL_DAYS} jours offerts</strong>, puis {info.price}
            </p>
            {justPaid && <p className="c-note">Merci ! Ton abonnement est enregistré.</p>}
            {!info.signedIn ? (
              <Link href="/compte" className="btn">
                Crée ton compte pour essayer
              </Link>
            ) : subscribed ? (
              <>
                <p>
                  {s!.cancelAtPeriodEnd
                    ? `Abonnement résilié : Pro jusqu’au ${day(s!.periodEnd)}, rien ne sera plus prélevé.`
                    : s!.status === 'trialing'
                      ? `Pro offert jusqu’au ${day(s!.periodEnd)}, puis ${info.price}.`
                      : `Abonné. Prochain renouvellement le ${day(s!.periodEnd)}.`}
                </p>
                {s!.status === 'past_due' && <p className="c-note c-note--error">Le dernier paiement a échoué. Mets à jour ta carte.</p>}
                <div className="pro__actions">
                  <button type="button" className="ui-btn" disabled={busy} onClick={() => go('/api/pro/portail')}>
                    Carte et factures
                  </button>
                  {!s!.cancelAtPeriodEnd && (
                    <button
                      type="button"
                      className="ui-btn"
                      disabled={busy}
                      onClick={() =>
                        window.confirm('Résilier Décode Pro ? Tu le gardes jusqu’à la fin de la période payée.') &&
                        act(async () => {
                          await post('/api/pro/resilier');
                          await load();
                        })
                      }
                    >
                      Résilier
                    </button>
                  )}
                </div>
              </>
            ) : inTrial ? (
              <>
                <p>Ton essai Pro court jusqu’au {day(s!.trialUntil)}. Ensuite, Pro s’arrête tout seul.</p>
                <button type="button" className="btn" disabled={busy} onClick={() => go('/api/pro/abonnement')}>
                  Garder Pro après l’essai
                </button>
                <p className="pro__small">Le premier prélèvement aura lieu à la fin de l’essai. Résiliable en un clic.</p>
              </>
            ) : !s?.trialUsed ? (
              <>
                <button
                  type="button"
                  className="btn"
                  disabled={busy}
                  onClick={() =>
                    act(async () => {
                      await post('/api/pro/essai');
                      await load();
                    })
                  }
                >
                  Essayer {TRIAL_DAYS} jours gratuits
                </button>
                <p className="pro__small">Sans carte bancaire. À la fin, Pro s’arrête tout seul si tu ne t’abonnes pas.</p>
              </>
            ) : (
              <>
                <button type="button" className="btn" disabled={busy} onClick={() => go('/api/pro/abonnement')}>
                  S’abonner
                </button>
                <p className="pro__small">Sans engagement. Résiliable en un clic depuis cette page.</p>
              </>
            )}
            {error && (
              <p className="c-note c-note--error" role="alert">
                {error}
              </p>
            )}
          </>
        )}
      </div>

      <section className="pro__free">
        <h2>Gratuit, pour toujours</h2>
        <ul role="list">
          {FREE.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      </section>
      <p className="pro__small">
        Paiement sécurisé par Stripe. <Link href="/cgv">Conditions de vente</Link>.
      </p>
    </div>
  );
}
