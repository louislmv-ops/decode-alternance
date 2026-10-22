'use client';

import { useState } from 'react';
import { LEVEL_SHORT } from '@/lib/community/shared';
import { call, type PublicMember } from './ui';

export function ProfileEditor({ member, onSaved, onCancel }: { member: PublicMember; onSaved: (m: PublicMember) => void; onCancel: () => void }) {
  const [f, setF] = useState({ ...member, skillsText: member.skills.join(', ') });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((prev) => ({ ...prev, [k]: v }));

  return (
    <form
      className="c-join c-edit"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        const { skillsText, ...rest } = f;
        const skills = skillsText.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 8);
        try {
          const { member: saved } = await call<{ member: PublicMember }>('/api/communaute/moi', 'PUT', { ...rest, skills, startMonth: rest.startMonth || null, visibleToCompanies: rest.seeking && rest.visibleToCompanies });
          onSaved(saved);
        } catch (err) {
          setError((err as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2 className="c-join__title">Mon profil</h2>
      <div className="c-join__grid">
        <label className="ui-field">
          <span className="ui-label">Nom affiché</span>
          <input className="ui-input" value={f.name} maxLength={40} onChange={(e) => set('name', e.target.value)} required />
        </label>
        <label className="ui-field">
          <span className="ui-label">Pseudo</span>
          <input className="ui-input" value={f.handle} maxLength={20} onChange={(e) => set('handle', e.target.value)} required />
        </label>
        <label className="ui-field c-edit__wide">
          <span className="ui-label">Bio</span>
          <input className="ui-input" value={f.bio} maxLength={160} onChange={(e) => set('bio', e.target.value)} placeholder="En une phrase" />
        </label>
        <label className="ui-field">
          <span className="ui-label">Domaine</span>
          <input className="ui-input" value={f.domain} maxLength={40} onChange={(e) => set('domain', e.target.value)} placeholder="Marketing" />
        </label>
        <label className="ui-field">
          <span className="ui-label">Ville</span>
          <input className="ui-input" value={f.city} maxLength={40} onChange={(e) => set('city', e.target.value)} placeholder="Lyon" />
        </label>
        <label className="ui-field">
          <span className="ui-label">École</span>
          <input className="ui-input" value={f.school} maxLength={60} onChange={(e) => set('school', e.target.value)} />
        </label>
        <label className="ui-field">
          <span className="ui-label">Formation visée</span>
          <input className="ui-input" value={f.formation} maxLength={80} onChange={(e) => set('formation', e.target.value)} placeholder="Bachelor marketing digital" />
        </label>
        <label className="ui-field">
          <span className="ui-label">Niveau</span>
          <select className="ui-select" value={f.level ?? ''} onChange={(e) => set('level', e.target.value ? Number(e.target.value) : null)}>
            <option value="">Non précisé</option>
            {Object.entries(LEVEL_SHORT).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label className="ui-field">
          <span className="ui-label">Début</span>
          <input className="ui-input" type="month" value={f.startMonth ?? ''} onChange={(e) => set('startMonth', e.target.value || null)} />
        </label>
        <label className="ui-field">
          <span className="ui-label">Rythme</span>
          <input className="ui-input" value={f.rhythm} maxLength={60} onChange={(e) => set('rhythm', e.target.value)} placeholder="3 semaines entreprise / 1 école" />
        </label>
        <label className="ui-field c-edit__wide">
          <span className="ui-label">Compétences (8 max, séparées par des virgules)</span>
          <input className="ui-input" value={f.skillsText} onChange={(e) => set('skillsText', e.target.value)} placeholder="Canva, SEO, Excel" />
        </label>
        <label className="ui-field c-edit__wide">
          <span className="ui-label">LinkedIn</span>
          <input className="ui-input" type="url" value={f.linkedin} maxLength={200} onChange={(e) => set('linkedin', e.target.value)} placeholder="https://www.linkedin.com/in/..." />
        </label>
      </div>
      <label className="ui-check">
        <input type="checkbox" checked={f.seeking} onChange={(e) => set('seeking', e.target.checked)} />
        <span>Je cherche une alternance</span>
      </label>
      <label className="ui-check">
        <input type="checkbox" checked={f.visibleToCompanies} disabled={!f.seeking} onChange={(e) => set('visibleToCompanies', e.target.checked)} />
        <span>Les entreprises vérifiées peuvent me trouver et m’écrire. Mon e-mail reste caché.</span>
      </label>
      {error && (
        <p className="c-note c-note--error" role="alert">
          {error}
        </p>
      )}
      <div className="c-edit__actions">
        <button type="submit" className="btn" disabled={busy}>
          Enregistrer
        </button>
        <button type="button" className="ui-btn" onClick={onCancel}>
          Annuler
        </button>
      </div>
    </form>
  );
}
