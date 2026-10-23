'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useProfile } from '@/components/useProfile';
import type { CvGuess } from '@/lib/cv/extract';
import { DEPARTMENT_OPTIONS } from '@/lib/departments';
import { savePlace } from '@/lib/place';
import { Mascot } from '@/components/Mascot';
import { DOMAINS } from '@/lib/domains';
import type { DiplomaLevel } from '@/lib/rules/employer';

const OPEN_EVENT = 'decode:match';
const SEEN_KEY = 'decode.match.vu';

const LEVELS: { level: DiplomaLevel; label: string }[] = [
  { level: 3, label: 'CAP' },
  { level: 4, label: 'Bac' },
  { level: 5, label: 'Bac+2' },
  { level: 6, label: 'Bac+3' },
  { level: 7, label: 'Bac+5' },
];

type Step = 'start' | 'job' | 'place' | 'level' | 'age';
const STEPS: Step[] = ['job', 'place', 'level', 'age'];

/** Ouvre le questionnaire depuis n'importe quel bouton. */
export function openMatcher() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

export function MatchButton({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <button type="button" className={className} onClick={openMatcher}>
      {children}
    </button>
  );
}

/** Le questionnaire de 30 secondes : un CV ou quatre questions, puis les offres qui collent. */
export function Matcher() {
  const [profile, setProfile] = useProfile();
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [step, setStep] = useState<Step>('start');
  const [job, setJob] = useState('');
  const [department, setDepartment] = useState<string | null>(null);
  const [level, setLevel] = useState<DiplomaLevel | null>(null);
  const [age, setAge] = useState(21);
  const [cv, setCv] = useState<{ status: 'idle' | 'reading' } | { status: 'done'; city: string | null } | { status: 'error'; message: string }>({ status: 'idle' });

  const open = useCallback(() => {
    setJob(profile.job);
    setDepartment(profile.department);
    setLevel(profile.filled ? profile.level : null);
    setAge(profile.age);
    setStep('start');
    setCv({ status: 'idle' });
    dialog.current?.showModal();
    try {
      window.localStorage.setItem(SEEN_KEY, '1');
    } catch {
      // Sans stockage, la fenêtre pourra revenir : ce n'est pas grave.
    }
  }, [profile]);

  useEffect(() => {
    window.addEventListener(OPEN_EVENT, open);
    return () => window.removeEventListener(OPEN_EVENT, open);
  }, [open]);


  async function readCv(file: File) {
    setCv({ status: 'reading' });
    const body = new FormData();
    body.append('cv', file);
    try {
      const res = await fetch('/api/cv', { method: 'POST', body });
      const data = (await res.json()) as { guess?: CvGuess; error?: string };
      if (!res.ok || !data.guess) throw new Error(data.error ?? 'Impossible de lire ce CV.');
      const g = data.guess;
      if (g.job) setJob(g.job);
      if (g.department) setDepartment(g.department);
      if (g.level) setLevel(g.level);
      if (g.age) setAge(g.age);
      setCv({ status: 'done', city: g.city });
      setStep('job');
    } catch (error) {
      setCv({ status: 'error', message: (error as Error).message });
    }
  }

  function finish() {
    setProfile({ ...profile, job: job.trim(), department, level: level ?? profile.level, age });
    savePlace(department ? [department] : []);
    const params = new URLSearchParams();
    if (job.trim()) params.set('q', job.trim());
    params.set('dep', department ?? 'fr');
    if (level) params.set('niveau', String(level));
    dialog.current?.close();
    router.push(`/offres${params.size ? `?${params}` : ''}`);
  }

  const index = STEPS.indexOf(step as (typeof STEPS)[number]);
  const next = () => (index < STEPS.length - 1 ? setStep(STEPS[index + 1]!) : finish());
  const back = () => setStep(index <= 0 ? 'start' : STEPS[index - 1]!);

  return (
    <dialog ref={dialog} className="matcher" aria-labelledby="matcher-title" onClick={(e) => e.target === dialog.current && dialog.current?.close()}>
      <div className="matcher__box">
        <button type="button" className="matcher__close" aria-label="Fermer" onClick={() => dialog.current?.close()}>
          ×
        </button>

        {step === 'start' ? (
          <div className="matcher__step">
            <Mascot pose="etudiant" size={72} className="matcher__mascot" />
            <h2 id="matcher-title" className="matcher__title">
              Tes offres, sur mesure.
            </h2>
            <p className="matcher__lead">Balance ton CV ou réponds à 4 questions. On trie, tu postules.</p>
            <div className="matcher__choices">
              <label className={`matcher__choice matcher__choice--cv${cv.status === 'reading' ? ' is-busy' : ''}`}>
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  className="sr-only"
                  disabled={cv.status === 'reading'}
                  onChange={(e) => e.target.files?.[0] && readCv(e.target.files[0])}
                />
                <span className="matcher__choice-title">{cv.status === 'reading' ? 'Lecture du CV…' : 'Importer mon CV'}</span>
                <span className="matcher__choice-sub">PDF, 5 Mo max. Lu puis oublié.</span>
              </label>
              <button type="button" className="matcher__choice" onClick={() => setStep('job')} autoFocus>
                <span className="matcher__choice-title">4 questions</span>
                <span className="matcher__choice-sub">Métier, ville, niveau, âge.</span>
              </button>
            </div>
            {cv.status === 'error' && (
              <p className="matcher__error" role="alert">
                {cv.message}
              </p>
            )}
          </div>
        ) : (
          <div className="matcher__step">
            <div className="matcher__progress" aria-hidden="true">
              <span style={{ width: `${((index + 1) / STEPS.length) * 100}%` }} />
            </div>
            {cv.status === 'done' && step === 'job' && <p className="matcher__note">Lu dans ton CV : vérifie et corrige si besoin.</p>}

            {step === 'job' && (
              <>
                <h2 id="matcher-title" className="matcher__title">
                  Tu cherches quoi ?
                </h2>
                <input
                  className="matcher__input"
                  value={job}
                  onChange={(e) => setJob(e.target.value)}
                  placeholder="Ex. marketing, développeur, vente"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && next()}
                />
                <div className="matcher__chips">
                  {DOMAINS.map((d) => (
                    <button key={d.label} type="button" className="matcher__chip" aria-pressed={job === d.query} onClick={() => setJob(d.query)}>
                      {d.label}
                    </button>
                  ))}
                </div>
              </>
            )}

            {step === 'place' && (
              <>
                <h2 id="matcher-title" className="matcher__title">
                  Où ?
                </h2>
                {cv.status === 'done' && cv.city && <p className="matcher__note">Ton CV dit {cv.city}.</p>}
                <select className="matcher__input" value={department ?? ''} onChange={(e) => setDepartment(e.target.value || null)}>
                  <option value="">Toute la France</option>
                  {DEPARTMENT_OPTIONS.map((d) => (
                    <option key={d.code} value={d.code}>
                      {d.code} · {d.name}
                    </option>
                  ))}
                </select>
                <div className="matcher__chips">
                  {[
                    ['75', 'Paris'],
                    ['69', 'Lyon'],
                    ['13', 'Marseille'],
                    ['31', 'Toulouse'],
                    ['33', 'Bordeaux'],
                    ['59', 'Lille'],
                    ['44', 'Nantes'],
                    ['', 'Toute la France'],
                  ].map(([code, name]) => (
                    <button key={name} type="button" className="matcher__chip" aria-pressed={(department ?? '') === code} onClick={() => setDepartment(code || null)}>
                      {name}
                    </button>
                  ))}
                </div>
              </>
            )}

            {step === 'level' && (
              <>
                <h2 id="matcher-title" className="matcher__title">
                  Tu prépares quel niveau ?
                </h2>
                <div className="matcher__chips matcher__chips--big">
                  {LEVELS.map((l) => (
                    <button key={l.level} type="button" className="matcher__chip" aria-pressed={level === l.level} onClick={() => setLevel(l.level)}>
                      {l.label}
                    </button>
                  ))}
                </div>
              </>
            )}

            {step === 'age' && (
              <>
                <h2 id="matcher-title" className="matcher__title">
                  Ton âge ?
                </h2>
                <p className="matcher__note">Ton salaire minimum en dépend : on le calcule pour chaque offre.</p>
                <div className="matcher__age">
                  <button type="button" aria-label="Un an de moins" onClick={() => setAge((a) => Math.max(15, a - 1))}>
                    −
                  </button>
                  <span className="num" aria-live="polite">
                    {age} ans
                  </span>
                  <button type="button" aria-label="Un an de plus" onClick={() => setAge((a) => Math.min(35, a + 1))}>
                    +
                  </button>
                </div>
              </>
            )}

            <div className="matcher__nav">
              <button type="button" className="matcher__back" onClick={back}>
                Retour
              </button>
              <button type="button" className="btn" onClick={next}>
                {step === 'age' ? 'Voir mes offres' : 'Suivant'}
              </button>
            </div>
          </div>
        )}
      </div>
    </dialog>
  );
}
