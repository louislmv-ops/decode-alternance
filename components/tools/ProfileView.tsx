'use client';

import { useState } from 'react';
import { useProfile } from '@/components/useProfile';
import { formatEuros } from '@/lib/format';
import { daysLeftWithoutEmployer, RHYTHMS, type Profile, type Rhythm } from '@/lib/profile';
import { DIPLOMA_LEVELS, type DiplomaLevel } from '@/lib/rules/employer';
import { minimumSalary } from '@/lib/rules/salary';

export function ProfileView() {
  const [stored, save] = useProfile();
  const [draft, setDraft] = useState<Profile | null>(null);
  const [saved, setSaved] = useState(false);
  const p = draft ?? stored;
  const set = (patch: Partial<Profile>) => {
    setDraft({ ...p, ...patch });
    setSaved(false);
  };
  const m = minimumSalary(p);
  const left = p.cfaStart ? daysLeftWithoutEmployer(p.cfaStart) : null;

  return (
    <div className="screen">
      <div className="title-row">
        <div>
          <h1>Mon profil</h1>
          <p className="title-row__sub">Reste sur ton téléphone.</p>
        </div>
      </div>

      <form
        className="settings"
        onSubmit={(e) => {
          e.preventDefault();
          save(p);
          setDraft(null);
          setSaved(true);
        }}
      >
        <section className="settings__row">
          <div className="settings__label">
            <h2>Toi</h2>
          </div>
          <div className="settings__panel form-grid">
            <label className="ui-field">
              <span className="ui-label">Prénom</span>
              <input className="ui-input" value={p.firstName} onChange={(e) => set({ firstName: e.target.value })} autoComplete="given-name" />
            </label>
            <label className="ui-field">
              <span className="ui-label">Formation et école</span>
              <input className="ui-input" value={p.school} onChange={(e) => set({ school: e.target.value })} placeholder="Ex. BUT GEA à l’IUT de Rennes" />
            </label>
            <label className="ui-field">
              <span className="ui-label">Ville de l’école</span>
              <input className="ui-input" value={p.schoolCity} onChange={(e) => set({ schoolCity: e.target.value })} />
            </label>
            <label className="ui-field">
              <span className="ui-label">Diplôme préparé</span>
              <select className="ui-select" value={p.level} onChange={(e) => set({ level: Number(e.target.value) as DiplomaLevel })}>
                {DIPLOMA_LEVELS.map((l) => (
                  <option key={l.level} value={l.level}>
                    {l.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="settings__row">
          <div className="settings__label">
            <h2>Ton contrat</h2>
            <p>
              Ton minimum avec ces réglages : <strong className="num">{formatEuros(m.cents)}</strong> brut par mois ({m.rate} % du SMIC).
            </p>
          </div>
          <div className="settings__panel form-grid">
            <label className="ui-field">
              <span className="ui-label">Type de contrat</span>
              <select className="ui-select" value={p.contract} onChange={(e) => set({ contract: e.target.value === 'professionnalisation' ? 'professionnalisation' : 'apprentissage' })}>
                <option value="apprentissage">Apprentissage</option>
                <option value="professionnalisation">Contrat de professionnalisation</option>
              </select>
            </label>
            <label className="ui-field">
              <span className="ui-label">Âge au début du contrat</span>
              <input className="ui-input num" type="number" min={15} max={60} value={p.age} onChange={(e) => set({ age: Math.max(15, Math.min(60, Number(e.target.value) || 15)) })} />
            </label>
            <label className="ui-field">
              <span className="ui-label">Année de contrat</span>
              <select className="ui-select" value={p.year} onChange={(e) => set({ year: Number(e.target.value) as 1 | 2 | 3 })}>
                <option value={1}>1re année</option>
                <option value={2}>2e année</option>
                <option value={3}>3e année</option>
              </select>
            </label>
            <label className="ui-check">
              <input type="checkbox" checked={p.hasBacPro} onChange={(e) => set({ hasBacPro: e.target.checked })} />
              J’ai au moins un bac pro (contrat pro)
            </label>
          </div>
        </section>

        <section className="settings__row">
          <div className="settings__label">
            <h2>Ton école</h2>
            <p>
              {left === null
                ? 'En CFA sans entreprise ? Tu as 3 mois pour en trouver une.'
                : left > 0
                  ? `Il te reste ${left} jours pour signer avec une entreprise.`
                  : 'Le délai de 3 mois est passé : parle à ton CFA de la suite de ta formation.'}
            </p>
          </div>
          <div className="settings__panel form-grid">
            <label className="ui-field">
              <span className="ui-label">Rythme de ton école</span>
              <select className="ui-select" value={p.rhythm ?? ''} onChange={(e) => set({ rhythm: (e.target.value || null) as Rhythm | null })}>
                <option value="">Je ne sais pas encore</option>
                {RHYTHMS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="ui-field">
              <span className="ui-label">Rentrée au CFA sans entreprise</span>
              <input className="ui-input" type="date" value={p.cfaStart ?? ''} onChange={(e) => set({ cfaStart: e.target.value || null })} />
            </label>
          </div>
        </section>

        <div className="settings__save">
          <span aria-live="polite">{saved ? 'Enregistré' : draft ? 'Modifications non enregistrées' : ''}</span>
          <button type="submit" className="ui-btn ui-btn--primary" disabled={!draft}>
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  );
}
