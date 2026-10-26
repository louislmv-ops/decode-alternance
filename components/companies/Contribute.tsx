'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CRITERIA, HIRED, HIRED_LABELS } from '@/lib/companies/shared';

type Mine = { signedIn: boolean; review?: 'pending' | 'published' | 'rejected' | null; salaryYears?: number[]; verifiedDomain?: string | null };
type Tab = 'salaire' | 'avis' | 'pro';

async function post(url: string, body: unknown): Promise<string | null> {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (res.ok) return null;
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  return data.error ?? 'Une erreur est survenue.';
}

/** Donner son salaire, son avis, ou prouver qu'on y travaille. Tout est anonyme. */
export function Contribute({ siren, name }: { siren: string; name: string }) {
  const [mine, setMine] = useState<Mine | null>(null);
  const [tab, setTab] = useState<Tab | null>(null);
  const router = useRouter();

  // Après une contribution : l'état de la personne, et les moyennes de la page.
  const refresh = () => {
    router.refresh();
    return fetch(`/api/entreprises/${siren}/moi`)
      .then((r) => (r.ok ? r.json() : { signedIn: false }))
      .then(setMine)
      .catch(() => setMine({ signedIn: false }));
  };

  useEffect(() => {
    fetch(`/api/entreprises/${siren}/moi`)
      .then((r) => (r.ok ? r.json() : { signedIn: false }))
      .then(setMine)
      .catch(() => setMine({ signedIn: false }));
  }, [siren]);

  if (!mine) return null;
  return (
    <section className="e-block e-give" aria-labelledby="partager">
      <h2 id="partager">Tu y es ou tu y as été ?</h2>
      {!mine.signedIn ? (
        <p className="c-cta">
          <span>Partage ton salaire ou ton avis, anonymement.</span>
          <Link href="/compte" className="btn btn--small">
            Se connecter
          </Link>
        </p>
      ) : (
        <>
          <div className="c-tabs" role="tablist">
            {(
              [
                ['salaire', 'Mon salaire'],
                ['avis', 'Mon avis'],
                ['pro', mine.verifiedDomain ? 'Vérifié' : 'Vérifier'],
              ] as const
            ).map(([k, l]) => (
              <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(tab === k ? null : k)}>
                {l}
              </button>
            ))}
          </div>
          {tab === 'salaire' && <SalaryForm siren={siren} done={mine.salaryYears ?? []} onDone={refresh} />}
          {tab === 'avis' &&
            (mine.review ? (
              <p className="c-note">{mine.review === 'pending' ? 'Ton avis est en relecture.' : mine.review === 'published' ? 'Ton avis est publié. Merci.' : 'Ton avis n’a pas été publié : il ne respectait pas la charte.'}</p>
            ) : (
              <ReviewForm siren={siren} onDone={refresh} />
            ))}
          {tab === 'pro' && <WorkVerify siren={siren} name={name} domain={mine.verifiedDomain ?? null} onDone={refresh} />}
        </>
      )}
    </section>
  );
}

function SalaryForm({ siren, done, onDone }: { siren: string; done: number[]; onDone: () => void }) {
  const year = new Date().getFullYear();
  const [f, setF] = useState({ jobTitle: '', contract: 'apprentissage', age: '', contractYear: '1', hasBacPro: false, grossEuros: '', startYear: String(year), department: '' });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const text = (k: keyof typeof f, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="ui-field">
      <span className="ui-label">{label}</span>
      <input className="ui-input" value={String(f[k])} onChange={(e) => setF({ ...f, [k]: e.target.value })} required {...props} />
    </label>
  );
  if (msg?.ok) return <p className="c-note">{msg.text}</p>;
  return (
    <form
      className="c-join"
      onSubmit={async (e) => {
        e.preventDefault();
        const error = await post(`/api/entreprises/${siren}/salaire`, {
          ...f,
          age: Number(f.age),
          contractYear: Number(f.contractYear),
          grossEuros: Math.round(Number(f.grossEuros.replace(',', '.'))),
          startYear: Number(f.startYear),
        });
        setMsg(error ? { ok: false, text: error } : { ok: true, text: 'Merci. Ton salaire compte dans la médiane, sans ton nom.' });
        if (!error) onDone();
      }}
    >
      <div className="c-join__grid">
        {text('jobTitle', 'Poste', { maxLength: 80, placeholder: 'Assistant marketing' })}
        <label className="ui-field">
          <span className="ui-label">Contrat</span>
          <select className="ui-select" value={f.contract} onChange={(e) => setF({ ...f, contract: e.target.value })}>
            <option value="apprentissage">Apprentissage</option>
            <option value="professionnalisation">Professionnalisation</option>
          </select>
        </label>
        {text('grossEuros', 'Brut par mois (€)', { inputMode: 'decimal', placeholder: '1100' })}
        {text('age', 'Ton âge au début', { type: 'number', min: 15, max: 60, inputMode: 'numeric' })}
        {f.contract === 'apprentissage' ? (
          <label className="ui-field">
            <span className="ui-label">Année du contrat</span>
            <select className="ui-select" value={f.contractYear} onChange={(e) => setF({ ...f, contractYear: e.target.value })}>
              {[1, 2, 3].map((y) => (
                <option key={y} value={y} disabled={done.includes(y)}>
                  {y === 1 ? '1re année' : `${y}e année`}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label className="ui-check">
            <input type="checkbox" checked={f.hasBacPro} onChange={(e) => setF({ ...f, hasBacPro: e.target.checked })} />
            <span>J’ai au moins un bac pro</span>
          </label>
        )}
        {text('startYear', 'Année de début', { type: 'number', min: year - 3, max: year + 1, inputMode: 'numeric' })}
        {text('department', 'Département', { maxLength: 3, placeholder: '69' })}
      </div>
      <p className="c-note">Le brut, en haut de ta fiche de paie.</p>
      {msg && <p className="c-note c-note--error" role="alert">{msg.text}</p>}
      <button type="submit" className="btn">
        Envoyer
      </button>
    </form>
  );
}

function Rate({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <fieldset className="e-rate">
      <legend>{label}</legend>
      {[1, 2, 3, 4, 5].map((n) => (
        <label key={n} className={n <= value ? 'is-on' : ''}>
          <input type="radio" name={label} value={n} checked={value === n} onChange={() => onChange(n)} required />
          <span>{n}</span>
        </label>
      ))}
    </fieldset>
  );
}

function ReviewForm({ siren, onDone }: { siren: string; onDone: () => void }) {
  const year = new Date().getFullYear();
  const [f, setF] = useState({
    jobTitle: '',
    startYear: String(year),
    overall: 0,
    tutoring: 0,
    missions: 0,
    atmosphere: 0,
    schoolRhythm: 0,
    hired: 'pas_encore' as (typeof HIRED)[number],
    title: '',
    pros: '',
    cons: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  if (sent) return <p className="c-note">Merci. Ton avis sera relu puis publié, sans ton nom.</p>;
  return (
    <form
      className="c-join"
      onSubmit={async (e) => {
        e.preventDefault();
        const err = await post(`/api/entreprises/${siren}/avis`, { ...f, startYear: Number(f.startYear) });
        setError(err);
        if (!err) {
          setSent(true);
          onDone();
        }
      }}
    >
      <Rate label="Note globale" value={f.overall} onChange={(v) => setF({ ...f, overall: v })} />
      {CRITERIA.map(([k, l]) => (
        <Rate key={k} label={l} value={f[k]} onChange={(v) => setF({ ...f, [k]: v })} />
      ))}
      <div className="c-join__grid">
        <label className="ui-field">
          <span className="ui-label">Poste</span>
          <input className="ui-input" value={f.jobTitle} maxLength={80} onChange={(e) => setF({ ...f, jobTitle: e.target.value })} required />
        </label>
        <label className="ui-field">
          <span className="ui-label">Année de début</span>
          <input className="ui-input" type="number" min={year - 5} max={year} value={f.startYear} onChange={(e) => setF({ ...f, startYear: e.target.value })} required />
        </label>
        <label className="ui-field c-edit__wide">
          <span className="ui-label">À la fin</span>
          <select className="ui-select" value={f.hired} onChange={(e) => setF({ ...f, hired: e.target.value as (typeof HIRED)[number] })}>
            {HIRED.map((h) => (
              <option key={h} value={h}>
                {HIRED_LABELS[h]}
              </option>
            ))}
          </select>
        </label>
        <label className="ui-field c-edit__wide">
          <span className="ui-label">En une phrase</span>
          <input className="ui-input" value={f.title} maxLength={80} onChange={(e) => setF({ ...f, title: e.target.value })} required />
        </label>
        <label className="ui-field c-edit__wide">
          <span className="ui-label">Points forts</span>
          <textarea className="ui-textarea" rows={3} minLength={30} maxLength={1200} value={f.pros} onChange={(e) => setF({ ...f, pros: e.target.value })} required />
        </label>
        <label className="ui-field c-edit__wide">
          <span className="ui-label">Points faibles</span>
          <textarea className="ui-textarea" rows={3} minLength={30} maxLength={1200} value={f.cons} onChange={(e) => setF({ ...f, cons: e.target.value })} required />
        </label>
      </div>
      <p className="c-note">Parle de ton expérience, pas des personnes : pas de nom, pas d’accusation. Chaque avis est relu avant publication.</p>
      {error && (
        <p className="c-note c-note--error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="btn">
        Envoyer mon avis
      </button>
    </form>
  );
}

function WorkVerify({ siren, name, domain, onDone }: { siren: string; name: string; domain: string | null; onDone: () => void }) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (domain) return <p className="c-note">Adresse @{domain} vérifiée. Tes avis portent la mention « e-mail pro vérifié ».</p>;
  return (
    <form
      className="c-join"
      onSubmit={async (e) => {
        e.preventDefault();
        const err = await post(`/api/entreprises/${siren}/verifier`, sent ? { email, code } : { email });
        setError(err);
        if (!err && !sent) setSent(true);
        else if (!err) onDone();
      }}
    >
      <p className="c-note">Reçois un code sur ton adresse chez {name}. Elle n’est jamais affichée : seule la mention « e-mail pro vérifié » apparaît.</p>
      <input className="ui-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="prenom.nom@entreprise.fr" aria-label="Adresse pro" required disabled={sent} />
      {sent && <input className="ui-input" inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value)} placeholder="000000" aria-label="Code reçu" maxLength={6} required />}
      {error && (
        <p className="c-note c-note--error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="btn btn--small">
        {sent ? 'Valider' : 'Recevoir un code'}
      </button>
    </form>
  );
}
