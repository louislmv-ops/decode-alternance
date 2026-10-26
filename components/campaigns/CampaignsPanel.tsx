'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { call } from '@/components/community/ui';
import { LEVEL_SHORT } from '@/lib/community/shared';
import type { Campaign } from '@/lib/recruiters/campaigns';

const EMPTY = { title: '', body: '', domain: '', cities: '', levels: [] as number[], positions: '', startMonth: '', deadline: '', applyUrl: '' };

/** L'espace entreprise : ses campagnes, et le formulaire pour en lancer une. */
export function CampaignsPanel() {
  const [mine, setMine] = useState<Campaign[] | null>(null);
  const [form, setForm] = useState(false);

  useEffect(() => {
    call<{ campaigns: Campaign[] }>('/api/campagnes?moi=1').then((d) => setMine(d.campaigns)).catch(() => setMine([]));
  }, []);

  return (
    <section className="r-section">
      <div className="r-company">
        <h2>Tes campagnes</h2>
        {!form && (
          <button type="button" className="btn btn--small" onClick={() => setForm(true)}>
            Lancer une campagne
          </button>
        )}
      </div>
      {form && (
        <CampaignForm
          onCancel={() => setForm(false)}
          onCreated={(c) => {
            setForm(false);
            setMine((all) => [c, ...(all ?? [])]);
          }}
        />
      )}
      {mine?.length === 0 && !form && <p className="c-note">Plusieurs postes, une date limite. Visible sur la page Campagnes.</p>}
      <ul className="r-campaigns" role="list">
        {mine?.map((c) => (
          <li key={c.id}>
            <Link href={`/campagnes/${c.id}`} className="link">
              {c.title}
            </Link>
            <span className="c-post__meta">{c.open ? `jusqu’au ${c.deadline.split('-').reverse().join('/')}` : 'close'}</span>
            <button
              type="button"
              className="ui-btn ui-btn--small"
              onClick={async () => {
                if (!window.confirm('Clore cette campagne ? Elle disparaît du site.')) return;
                await call(`/api/campagnes/${c.id}`, 'DELETE');
                setMine((all) => (all ?? []).filter((x) => x.id !== c.id));
              }}
            >
              Clore
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function CampaignForm({ onCreated, onCancel }: { onCreated: (c: Campaign) => void; onCancel: () => void }) {
  const [f, setF] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const input = (k: Exclude<keyof typeof EMPTY, 'levels'>, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="ui-field">
      <span className="ui-label">{label}</span>
      <input className="ui-input" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} {...props} />
    </label>
  );
  return (
    <form
      className="c-join"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        try {
          const { campaign } = await call<{ campaign: Campaign }>('/api/campagnes', 'POST', {
            ...f,
            positions: f.positions ? Number(f.positions) : null,
            startMonth: f.startMonth || null,
          });
          onCreated(campaign);
        } catch (err) {
          setError((err as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="c-join__grid">
        <div className="c-edit__wide">{input('title', 'Titre', { required: true, maxLength: 100, placeholder: 'Alternance rentrée 2027' })}</div>
        <label className="ui-field c-edit__wide">
          <span className="ui-label">Description</span>
          <textarea
            className="ui-textarea"
            rows={5}
            required
            minLength={30}
            maxLength={2000}
            value={f.body}
            onChange={(e) => setF({ ...f, body: e.target.value })}
            placeholder="Les métiers, l’équipe, le rythme, ce que l’alternant apprendra."
          />
        </label>
        {input('domain', 'Domaines', { maxLength: 60, placeholder: 'Marketing, data' })}
        {input('cities', 'Villes', { maxLength: 120, placeholder: 'Paris, Lyon' })}
        {input('positions', 'Nombre de postes', { type: 'number', min: 1, max: 999, inputMode: 'numeric' })}
        {input('startMonth', 'Début', { type: 'month' })}
        {input('deadline', 'Date limite', { type: 'date', required: true })}
        {input('applyUrl', 'Lien pour candidater', { type: 'url', required: true, placeholder: 'https://' })}
      </div>
      <fieldset className="r-levels">
        <legend className="ui-label">Niveaux</legend>
        {Object.entries(LEVEL_SHORT).map(([v, l]) => (
          <label key={v} className="ui-check">
            <input
              type="checkbox"
              checked={f.levels.includes(Number(v))}
              onChange={(e) => setF({ ...f, levels: e.target.checked ? [...f.levels, Number(v)].sort() : f.levels.filter((x) => x !== Number(v)) })}
            />
            <span>{l}</span>
          </label>
        ))}
      </fieldset>
      {error && (
        <p className="c-note c-note--error" role="alert">
          {error}
        </p>
      )}
      <div className="c-edit__actions">
        <button type="submit" className="btn" disabled={busy}>
          Publier la campagne
        </button>
        <button type="button" className="ui-btn" onClick={onCancel}>
          Annuler
        </button>
      </div>
    </form>
  );
}
