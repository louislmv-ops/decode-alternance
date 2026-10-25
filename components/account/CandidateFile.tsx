'use client';

import { useEffect, useState } from 'react';
import type { PublicAccount } from '@/lib/account/http';
import type { Candidate, CvMeta } from '@/lib/account/store';
import { CV_ACCEPT } from '@/lib/cv/accept';

const FIELDS: { key: keyof Candidate; label: string; placeholder: string; type?: string; autoComplete?: string }[] = [
  { key: 'firstName', label: 'Prénom', placeholder: 'Léa', autoComplete: 'given-name' },
  { key: 'lastName', label: 'Nom', placeholder: 'Martin', autoComplete: 'family-name' },
  { key: 'phone', label: 'Téléphone', placeholder: '06 12 34 56 78', type: 'tel', autoComplete: 'tel' },
  { key: 'city', label: 'Ville', placeholder: 'Lyon', autoComplete: 'address-level2' },
  { key: 'school', label: 'École ou formation', placeholder: 'BTS MCO, IUT de Lyon' },
  { key: 'available', label: 'Disponible à partir de', placeholder: 'septembre 2026, rythme 3 jours / 2 jours' },
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'linkedin.com/in/…', type: 'url' },
  { key: 'portfolio', label: 'Portfolio ou site', placeholder: 'https://…', type: 'url' },
];

/**
 * Le dossier de candidature : le CV et ce qu'on recopie à chaque fois (coordonnées, pitch).
 * Rempli une fois, il sert sur chaque offre pour postuler en deux clics.
 */
export function CandidateFile({ account, onChange }: { account: PublicAccount; onChange: (a: PublicAccount) => void }) {
  const [form, setForm] = useState<Candidate>(account.candidate ?? {});
  const [cv, setCv] = useState<CvMeta | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch('/api/compte')
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { cv?: CvMeta | null } | null) => setCv(d?.cv ?? null))
      .catch(() => {});
  }, []);

  async function upload(file: File) {
    setBusy(true);
    setStatus(null);
    const body = new FormData();
    body.set('cv', file);
    const res = await fetch('/api/compte/cv', { method: 'POST', body }).catch(() => null);
    const data = (await res?.json().catch(() => ({}))) as { cv?: CvMeta; error?: string } | undefined;
    setBusy(false);
    if (!res?.ok || !data?.cv) return setStatus(data?.error ?? 'L’envoi a échoué.');
    setCv(data.cv);
    setStatus('CV enregistré.');
  }

  async function save() {
    setStatus(null);
    const res = await fetch('/api/compte', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ candidate: form }) }).catch(() => null);
    const data = (await res?.json().catch(() => ({}))) as { account?: PublicAccount; error?: string } | undefined;
    if (!res?.ok || !data?.account) return setStatus(data?.error ?? 'L’enregistrement a échoué.');
    onChange(data.account);
    setStatus('Dossier enregistré.');
  }

  return (
    <section className="acct-group cand" aria-labelledby="cand-title">
      <h2 id="cand-title">Mon dossier de candidature</h2>
      <p className="acct-hint">Rempli une fois, il sert sur chaque offre : ton CV à joindre et un message prêt à copier.</p>

      <div className="cand__cv">
        {cv ? (
          <p className="cand__file">
            <strong>{cv.name}</strong> <span>{Math.max(1, Math.round(cv.size / 1024))} Ko</span>
            <a className="acct-link" href="/api/compte/cv">
              Télécharger
            </a>
            <button
              type="button"
              className="acct-link"
              onClick={async () => {
                await fetch('/api/compte/cv', { method: 'DELETE' }).catch(() => null);
                setCv(null);
              }}
            >
              Supprimer
            </button>
          </p>
        ) : (
          <p className="acct-hint">Pas encore de CV.</p>
        )}
        <label className="ui-btn cand__upload">
          {busy ? 'Envoi…' : cv ? 'Remplacer mon CV' : 'Ajouter mon CV'}
          <input
            type="file"
            accept={CV_ACCEPT}
            className="sr-only"
            disabled={busy}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void upload(f);
              e.target.value = '';
            }}
          />
        </label>
        <p className="acct-hint">PDF, Word, OpenDocument, RTF ou photo, 5 Mo max.</p>
      </div>

      <form
        className="cand__grid"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        {FIELDS.map((f) => (
          <label key={f.key} className="cand__field">
            <span className="ui-label">{f.label}</span>
            <input
              className="ui-input"
              type={f.type ?? 'text'}
              autoComplete={f.autoComplete}
              placeholder={f.placeholder}
              value={form[f.key] ?? ''}
              onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
            />
          </label>
        ))}
        <label className="cand__field cand__field--wide">
          <span className="ui-label">Ton pitch en deux ou trois phrases</span>
          <textarea
            className="ui-textarea"
            rows={3}
            maxLength={600}
            placeholder="Étudiante en BTS MCO, j’ai tenu une boutique pendant un été et j’adore le contact client. Je cherche une alternance en vente pour…"
            value={form.pitch ?? ''}
            onChange={(e) => setForm({ ...form, pitch: e.target.value })}
          />
        </label>
        <div className="cand__actions">
          <button type="submit" className="btn btn--small">
            Enregistrer mon dossier
          </button>
          {status && (
            <span className="acct-hint" role="status">
              {status}
            </span>
          )}
        </div>
      </form>
    </section>
  );
}
