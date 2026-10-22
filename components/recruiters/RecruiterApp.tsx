'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AlternantCard } from '@/components/community/AlternantCard';
import { Avatar, call, type PublicMember } from '@/components/community/ui';
import { LEVEL_SHORT } from '@/lib/community/shared';
import type { Recruiter } from '@/lib/recruiters/store';

type State = { signedIn: boolean; recruiter: Recruiter | null };

export function RecruiterApp({ open }: { open: boolean }) {
  const [state, setState] = useState<State | null>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!open) return;
    call<State>('/api/recruteur').then(setState).catch(() => setState({ signedIn: false, recruiter: null }));
  }, [open]);

  if (!open) return <p className="c-empty">L’espace entreprise ouvre très vite.</p>;
  if (!state) return <p className="c-empty">Chargement…</p>;
  if (!state.signedIn) {
    return (
      <div className="c-cta">
        <p>
          <strong>Connecte-toi avec ton e-mail pro pour commencer.</strong>
        </p>
        <Link href="/compte" className="btn btn--small">
          Se connecter
        </Link>
      </div>
    );
  }
  if (!state.recruiter || editing) {
    return (
      <CompanyForm
        initial={state.recruiter}
        onSaved={(recruiter) => {
          setEditing(false);
          setState({ ...state, recruiter });
        }}
      />
    );
  }
  const r = state.recruiter;
  return (
    <>
      <div className="r-company">
        <p>
          <strong>{r.company}</strong> · SIRET <span className="num">{r.siret}</span> · {r.verified ? 'Vérifiée' : 'En attente de vérification'}
        </p>
        <button type="button" className="ui-btn ui-btn--small" onClick={() => setEditing(true)}>
          Modifier
        </button>
      </div>
      {r.verified ? (
        <Search />
      ) : (
        <p className="c-note">On vérifie l’entreprise à la main, sous 48 h ouvrées. Tu pourras ensuite chercher et contacter des alternants.</p>
      )}
    </>
  );
}

function CompanyForm({ initial, onSaved }: { initial: Recruiter | null; onSaved: (r: Recruiter) => void }) {
  const [f, setF] = useState({
    company: initial?.company ?? '',
    siret: initial?.siret ?? '',
    website: initial?.website ?? '',
    contactName: initial?.contactName ?? '',
    role: initial?.role ?? '',
  });
  const [error, setError] = useState<string | null>(null);
  const field = (k: keyof typeof f, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
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
        setError(null);
        try {
          onSaved((await call<{ recruiter: Recruiter }>('/api/recruteur', 'PUT', f)).recruiter);
        } catch (err) {
          setError((err as Error).message);
        }
      }}
    >
      <h2 className="c-join__title">Ton entreprise</h2>
      <div className="c-join__grid">
        {field('company', 'Entreprise', { required: true, maxLength: 80 })}
        {field('siret', 'SIRET', { required: true, inputMode: 'numeric', placeholder: '14 chiffres' })}
        {field('contactName', 'Ton nom', { required: true, maxLength: 60 })}
        {field('role', 'Ton poste', { maxLength: 60, placeholder: 'RH, manager…' })}
        {field('website', 'Site de l’entreprise', { type: 'url', placeholder: 'https://' })}
      </div>
      <p className="c-note">Changer d’entreprise ou de SIRET relance la vérification.</p>
      {error && (
        <p className="c-note c-note--error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="btn">
        Envoyer
      </button>
    </form>
  );
}

function Search() {
  const [q, setQ] = useState({ domaine: '', ville: '', niveau: '', debut: '' });
  const [results, setResults] = useState<PublicMember[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    const params = new URLSearchParams(Object.entries(q).filter(([, v]) => v));
    try {
      setResults((await call<{ candidates: PublicMember[] }>(`/api/recruteur/candidats?${params}`)).candidates);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <>
      <form className="r-search" onSubmit={run}>
        <input className="ui-input" placeholder="Domaine ou compétence" value={q.domaine} onChange={(e) => setQ({ ...q, domaine: e.target.value })} aria-label="Domaine ou compétence" />
        <input className="ui-input" placeholder="Ville" value={q.ville} onChange={(e) => setQ({ ...q, ville: e.target.value })} aria-label="Ville" />
        <select className="ui-select" value={q.niveau} onChange={(e) => setQ({ ...q, niveau: e.target.value })} aria-label="Niveau">
          <option value="">Tous niveaux</option>
          {Object.entries(LEVEL_SHORT).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <input className="ui-input" type="month" value={q.debut} onChange={(e) => setQ({ ...q, debut: e.target.value })} aria-label="Disponible avant" />
        <button type="submit" className="btn btn--small">
          Chercher
        </button>
      </form>
      {error && <p className="c-note c-note--error">{error}</p>}
      {results?.length === 0 && <p className="c-empty">Personne pour ces critères. Élargis la recherche.</p>}
      <div className="r-results">
        {results?.map((m) => (
          <Candidate key={m.handle} member={m} />
        ))}
      </div>
    </>
  );
}

function Candidate({ member: m }: { member: PublicMember }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [note, setNote] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  return (
    <article className="r-candidate">
      <Link href={`/membres/${m.handle}`} className="c-member__link">
        <Avatar name={m.name} size={44} />
        <span>
          <span className="c-member__name">{m.name}</span>
          <span className="c-member__meta">{[m.domain, m.city, m.school].filter(Boolean).join(' · ')}</span>
        </span>
      </Link>
      {m.bio && <p className="c-profile__bio">{m.bio}</p>}
      <AlternantCard member={m} />
      {sent ? (
        <p className="c-note">Message envoyé. La réponse arrivera dans ta boîte mail.</p>
      ) : open ? (
        <form
          className="r-contact"
          onSubmit={async (e) => {
            e.preventDefault();
            setNote(null);
            try {
              await call('/api/recruteur/contact', 'POST', { handle: m.handle, message });
              setSent(true);
            } catch (err) {
              setNote((err as Error).message);
            }
          }}
        >
          <textarea
            className="ui-textarea"
            rows={4}
            minLength={30}
            maxLength={1000}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Le poste, le rythme, la date de début, et pourquoi son profil."
            aria-label={`Message à ${m.name}`}
            required
          />
          {note && <p className="c-note c-note--error">{note}</p>}
          <button type="submit" className="btn btn--small">
            Envoyer
          </button>
        </form>
      ) : (
        <button type="button" className="btn btn--small" onClick={() => setOpen(true)}>
          Contacter
        </button>
      )}
    </article>
  );
}
