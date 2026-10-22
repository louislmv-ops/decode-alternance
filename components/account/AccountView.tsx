'use client';

import Link from 'next/link';
import type { ProState } from '@/lib/pro/plan';
import { useEffect, useState } from 'react';
import { useProfile } from '@/components/useProfile';
import type { PublicAccount } from '@/lib/account/http';
import { maskPhone } from '@/lib/account/phone';
import { DEPARTMENT_NAMES } from '@/lib/departments';
import { SIGNED_IN_EVENT } from './AccountSync';

const LEVEL_SHORT: Record<number, string> = { 3: 'CAP', 4: 'Bac', 5: 'Bac+2', 6: 'Bac+3', 7: 'Bac+5' };

async function call<T>(url: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(url, { method, headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(data.error ?? 'Une erreur est survenue.');
  return data;
}

/** Connexion en deux temps : l'adresse, puis le code reçu par e-mail. */
function SignIn({ onDone }: { onDone: (a: PublicAccount) => void }) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (step === 'email') {
        await call('/api/compte/code', 'POST', { email });
        setStep('code');
      } else {
        const { account } = await call<{ account: PublicAccount }>('/api/compte/connexion', 'POST', { email, code });
        onDone(account);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="acct-box" onSubmit={submit}>
      <h1 className="acct-title">{step === 'email' ? 'Ton compte' : 'Ton code'}</h1>
      <p className="acct-sub">{step === 'email' ? 'Sans mot de passe. On t’envoie un code.' : `Envoyé à ${email}.`}</p>
      {step === 'email' ? (
        <input
          className="acct-input"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="ton@email.fr"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
        />
      ) : (
        <input
          className="acct-input acct-input--code num"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{6}"
          maxLength={6}
          placeholder="000000"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          required
          autoFocus
        />
      )}
      {error && (
        <p className="acct-error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="btn acct-go" disabled={busy}>
        {busy ? '…' : step === 'email' ? 'Recevoir le code' : 'Se connecter'}
      </button>
      {step === 'code' && (
        <button type="button" className="acct-link" onClick={() => setStep('email')}>
          Changer d’adresse
        </button>
      )}
    </form>
  );
}

function Toggle({ label, checked, disabled, onChange }: { label: string; checked: boolean; disabled?: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className={`acct-toggle${disabled ? ' is-off' : ''}`}>
      <span>{label}</span>
      <input type="checkbox" role="switch" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

function Phone({ account, sms, onChange }: { account: PublicAccount; sms: boolean; onChange: (a: PublicAccount) => void }) {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!sms) return <p className="acct-note">SMS bientôt disponibles.</p>;
  if (account.phoneVerified && account.phone) {
    return (
      <p className="acct-note">
        {maskPhone(account.phone)}{' '}
        <button
          type="button"
          className="acct-link"
          onClick={async () => {
            await call('/api/compte/telephone', 'DELETE');
            onChange({ ...account, phone: null, phoneVerified: false, alertSms: false });
          }}
        >
          Retirer
        </button>
      </p>
    );
  }
  return (
    <div className="acct-phone">
      <input className="acct-input" type="tel" inputMode="tel" autoComplete="tel" placeholder="06 12 34 56 78" value={phone} onChange={(e) => setPhone(e.target.value)} />
      {sent && (
        <input
          className="acct-input acct-input--code num"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="Code SMS"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
        />
      )}
      <button
        type="button"
        className="btn btn--small"
        onClick={async () => {
          setError(null);
          try {
            if (!sent) {
              await call('/api/compte/telephone', 'POST', { phone });
              setSent(true);
            } else {
              const { account: next } = await call<{ account: PublicAccount }>('/api/compte/telephone/verifier', 'POST', { phone, code });
              onChange(next);
            }
          } catch (err) {
            setError((err as Error).message);
          }
        }}
      >
        {sent ? 'Valider' : 'Recevoir un code'}
      </button>
      {error && (
        <p className="acct-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function Settings({ account, sms, onChange }: { account: PublicAccount; sms: boolean; onChange: (a: PublicAccount | null) => void }) {
  const [profile] = useProfile();
  const [error, setError] = useState<string | null>(null);
  const [pro, setPro] = useState<ProState | null>(null);

  useEffect(() => {
    fetch('/api/pro')
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { state?: ProState } | null) => setPro(d?.state ?? null))
      .catch(() => {});
  }, []);

  async function patch(body: Record<string, unknown>) {
    setError(null);
    try {
      onChange((await call<{ account: PublicAccount }>('/api/compte', 'PATCH', body)).account);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const search = account.savedSearch;
  const summary = [search.q, search.dep ? DEPARTMENT_NAMES[search.dep] : null, search.niveau ? LEVEL_SHORT[search.niveau] : null].filter(Boolean).join(' · ');
  const fromProfile = { q: profile.job || undefined, dep: profile.department ?? undefined, niveau: profile.filled ? profile.level : undefined };

  return (
    <div className="acct-box">
      <h1 className="acct-title">Ton compte</h1>
      <p className="acct-sub">{account.email}</p>

      <section className="acct-group" aria-labelledby="alerts-title">
        <h2 id="alerts-title">Alertes nouvelles offres</h2>
        <p className="acct-row">
          <span>{summary || 'Aucune recherche suivie'}</span>
          <button type="button" className="acct-link" onClick={() => patch({ savedSearch: fromProfile })} disabled={!profile.filled}>
            {summary ? 'Reprendre mon profil' : 'Suivre mon profil'}
          </button>
        </p>
        {!profile.filled && (
          <p className="acct-note">
            <Link href="/offres">Remplis d’abord tes critères</Link>.
          </p>
        )}
        <Toggle label="Par e-mail" checked={account.alertEmail} onChange={(v) => patch({ alertEmail: v })} />
        {pro?.pro ? (
          <>
            <Toggle label="Par SMS" checked={account.alertSms} disabled={!account.phoneVerified} onChange={(v) => patch({ alertSms: v })} />
            <Phone account={account} sms={sms} onChange={onChange} />
            <p className="acct-note">Pro : tu reçois aussi les nouvelles offres toutes les heures en journée.</p>
          </>
        ) : (
          <p className="acct-note">
            Par SMS et toutes les heures : <Link href="/pro">avec Pro</Link>.
          </p>
        )}
        <div className="acct-freq" role="group" aria-label="Fréquence">
          {(['quotidien', 'hebdo'] as const).map((f) => (
            <button key={f} type="button" aria-pressed={account.alertFrequency === f} onClick={() => patch({ alertFrequency: f })}>
              {f === 'quotidien' ? 'Chaque jour' : 'Chaque semaine'}
            </button>
          ))}
        </div>
      </section>

      <section className="acct-group" aria-labelledby="pro-title">
        <h2 id="pro-title">Décode Pro</h2>
        <p className="acct-row">
          <span>{pro?.pro ? (pro.status ? 'Abonné' : `Essai jusqu’au ${new Date(pro.trialUntil!).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', timeZone: 'Europe/Paris' })}`) : 'Version gratuite'}</span>
          <Link href="/pro" className="acct-link">
            {pro?.pro ? 'Gérer' : pro?.trialUsed ? 'Voir Pro' : '1 mois offert'}
          </Link>
        </p>
      </section>

      <section className="acct-group" aria-labelledby="sync-title">
        <h2 id="sync-title">Sur tous tes appareils</h2>
        <p className="acct-note">Profil et suivi sauvegardés automatiquement.</p>
        <Link href="/profil" className="acct-link">
          Modifier mon profil
        </Link>
      </section>

      {error && (
        <p className="acct-error" role="alert">
          {error}
        </p>
      )}

      <div className="acct-end">
        <button
          type="button"
          className="acct-link"
          onClick={async () => {
            await call('/api/compte/deconnexion', 'POST');
            window.dispatchEvent(new Event(SIGNED_IN_EVENT));
            onChange(null);
          }}
        >
          Se déconnecter
        </button>
        <button
          type="button"
          className="acct-link acct-link--danger"
          onClick={async () => {
            if (!window.confirm('Supprimer ton compte et tout ce qu’il contient ?')) return;
            await call('/api/compte', 'DELETE');
            onChange(null);
          }}
        >
          Supprimer mon compte
        </button>
      </div>
    </div>
  );
}

export function AccountView({ enabled, sms }: { enabled: boolean; sms: boolean }) {
  const [account, setAccount] = useState<PublicAccount | null | undefined>(undefined);

  useEffect(() => {
    if (!enabled) return;
    fetch('/api/compte')
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { account?: PublicAccount } | null) => setAccount(d?.account ?? null))
      .catch(() => setAccount(null));
  }, [enabled]);

  if (!enabled) {
    return (
      <div className="screen acct">
        <div className="acct-box">
          <h1 className="acct-title">Ton compte</h1>
          <p className="acct-sub">Bientôt : alertes par e-mail et SMS, et ton suivi sur tous tes appareils.</p>
          <Link href="/profil" className="btn">
            Mon profil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="screen acct">
      {account === undefined ? (
        <div className="acct-box" aria-busy="true" />
      ) : account ? (
        <Settings account={account} sms={sms} onChange={setAccount} />
      ) : (
        <SignIn
          onDone={(a) => {
            window.dispatchEvent(new Event(SIGNED_IN_EVENT));
            setAccount(a);
          }}
        />
      )}
    </div>
  );
}
