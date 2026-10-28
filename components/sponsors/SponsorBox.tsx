'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type Info = {
  available: boolean;
  price: string | null;
  signedIn: boolean;
  recruiter: { company: string; verified: boolean } | null;
  sponsor: { active: boolean; status: string | null; periodEnd: string | null; cancelAtPeriodEnd: boolean } | null;
};

const NONE: Info = { available: false, price: null, signedIn: false, recruiter: null, sponsor: null };

/** Ouvre la page de paiement ou le portail Stripe. */
export async function goTo(url: string): Promise<void> {
  const res = await fetch(url, { method: 'POST' });
  const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!res.ok || !data.url) throw new Error(data.error ?? 'Une erreur est survenue.');
  window.location.href = data.url;
}

/** Le prix, et le bouton qui correspond à où en est l'entreprise. */
export function SponsorBox() {
  const [info, setInfo] = useState<Info | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch('/api/pro')
      .then((r) => (r.ok ? r.json() : NONE))
      .then(setInfo)
      .catch(() => setInfo(NONE));
  }, []);

  async function subscribe() {
    setBusy(true);
    setError(null);
    try {
      await goTo('/api/pro/abonnement');
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="pro__box">
      {info === null ? (
        <p>Chargement…</p>
      ) : !info.available ? (
        <>
          <p className="pro__price">
            <strong>Bientôt disponible.</strong>
          </p>
          <p className="c-note">En attendant, l’espace entreprise est ouvert et gratuit.</p>
          <Link href="/recruteur" className="btn">
            Ouvrir l’espace entreprise
          </Link>
        </>
      ) : (
        <>
          <p className="pro__price">
            <strong>{info.price} HT</strong>, sans engagement
          </p>
          {!info.signedIn ? (
            <>
              <Link href="/compte" className="btn">
                Se connecter avec ton e-mail pro
              </Link>
              <p className="c-note">Ensuite, inscris ton entreprise avec son SIRET dans l’espace entreprise.</p>
            </>
          ) : !info.recruiter ? (
            <Link href="/recruteur" className="btn">
              Inscrire ton entreprise
            </Link>
          ) : !info.recruiter.verified ? (
            <p className="c-note">On vérifie {info.recruiter.company} (SIRET et e-mail pro). Tu pourras t’abonner dès que c’est fait.</p>
          ) : info.sponsor?.active ? (
            <Link href="/pro/tableau" className="btn">
              Voir ton tableau de bord
            </Link>
          ) : (
            <button type="button" className="btn" disabled={busy} onClick={subscribe}>
              Mettre {info.recruiter.company} en avant
            </button>
          )}
          {error && <p className="c-note c-note--error">{error}</p>}
          <p className="pro__small">Paiement par carte via Stripe. Résiliable à tout moment, la mise en avant s’arrête à la fin du mois payé.</p>
        </>
      )}
    </div>
  );
}
