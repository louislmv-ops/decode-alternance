'use client';

import { useState } from 'react';
import { AgeInput } from '@/components/AgeInput';
import { CopyButton } from '@/components/offer/CopyButton';
import { useProfile } from '@/components/useProfile';
import { formatEuros } from '@/lib/format';
import { APPRENTISSAGE_RATES, APPRENTI_EXEMPTION_SOURCE, PROFESSIONNALISATION_RATES, SMIC } from '@/lib/rules/reference';
import { DIPLOMA_LEVELS, employerFigures, employerPitch, type CompanySize, type DiplomaLevel } from '@/lib/rules/employer';
import { EMPLOYER_AIDS, EMPLOYER_PARTICIPATION, frenchDate } from '@/lib/rules/employer-aids';
import { apprenticeNetThresholdCents, clampYear, minimumSalary, type ContractKind } from '@/lib/rules/salary';

const smicDate = new Date(SMIC.since).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
const ordinal = (y: number) => `${y}${y === 1 ? 're' : 'e'}`;

export function SalaryView() {
  const [profile, saveProfile] = useProfile();
  const [draft, setDraft] = useState<{ contract: ContractKind; age: number; year: 1 | 2 | 3; hasBacPro: boolean } | null>(null);
  const [size, setSize] = useState<CompanySize>('moins-de-250');
  const [level, setLevel] = useState<DiplomaLevel | null>(null);
  const [disabled, setDisabled] = useState(false);
  const [saved, setSaved] = useState(false);

  const input = draft ?? { contract: profile.contract, age: profile.age, year: profile.year, hasBacPro: profile.hasBacPro };
  const lvl = level ?? profile.level;
  const set = (patch: Partial<typeof input>) => {
    setDraft({ ...input, ...patch });
    setSaved(false);
  };

  const m = minimumSalary(input);
  const employer = employerFigures({ contract: input.contract, size, level: lvl, disabledWorker: disabled });
  const yearly = m.cents * 12;
  const remaining = yearly - employer.aidCents + employer.participationCents;
  const levelLabel = DIPLOMA_LEVELS.find((l) => l.level === lvl)?.label ?? '';

  const pitch = employerPitch({
    contract: input.contract,
    size,
    level: lvl,
    disabledWorker: disabled,
    minimumLabel: formatEuros(m.cents),
    levelLabel,
    formatCents: (cents) => formatEuros(cents, 0),
  });
  const aid = employer.aid;

  return (
    <div className="screen">
      <div className="title-row">
        <div>
          <h1>Mon salaire minimum</h1>
          <p className="title-row__sub">SMIC au {smicDate}.</p>
        </div>
        <button
          type="button"
          className="ui-btn ui-btn--primary"
          onClick={() => {
            saveProfile({ ...profile, ...input, level: lvl });
            setSaved(true);
          }}
          disabled={saved}
        >
          {saved ? 'Enregistré dans ton profil' : 'Garder dans mon profil'}
        </button>
      </div>

      <div className="salary">
        <section className="panel salary__answer" aria-labelledby="answer-title">
          <h2 id="answer-title" className="sr-only">
            Ton minimum
          </h2>
          <div className="salary__controls">
            <div className="ui-field">
              <span className="ui-label" id="contract-l">
                Contrat
              </span>
              <div className="ui-segmented" role="group" aria-labelledby="contract-l">
                <button type="button" aria-pressed={input.contract === 'apprentissage'} onClick={() => set({ contract: 'apprentissage' })}>
                  Apprentissage
                </button>
                <button type="button" aria-pressed={input.contract === 'professionnalisation'} onClick={() => set({ contract: 'professionnalisation' })}>
                  Contrat pro
                </button>
              </div>
            </div>
            <div className="ui-field">
              <label className="ui-label" htmlFor="age-input">
                Ton âge
              </label>
              <AgeInput id="age-input" value={input.age} onChange={(age) => set({ age })} />
            </div>
            {input.contract === 'apprentissage' ? (
              <div className="ui-field">
                <span className="ui-label" id="year-l">
                  Année de contrat
                </span>
                <div className="ui-segmented" role="group" aria-labelledby="year-l">
                  {([1, 2, 3] as const).map((y) => (
                    <button key={y} type="button" aria-pressed={input.year === y} onClick={() => set({ year: clampYear(y) })}>
                      {ordinal(y)}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <label className="ui-check">
                <input type="checkbox" checked={input.hasBacPro} onChange={(e) => set({ hasBacPro: e.target.checked })} />
                J’ai au moins un bac pro ou un titre de même niveau
              </label>
            )}
          </div>

          <p className="salary__figure num" aria-live="polite">
            {formatEuros(m.cents)}
            <span className="ui-unit"> brut par mois</span>
          </p>
          <p className="salary__line">
            {m.rate} % du SMIC · {m.bracket}
            {input.contract === 'apprentissage' ? ` · ${ordinal(input.year)} année` : input.hasBacPro ? ' · avec bac pro' : ''}
          </p>
          <ul className="bullets salary__notes">
            {input.contract === 'apprentissage' && (
              <li>Sous {formatEuros(apprenticeNetThresholdCents(), 0)} brut, ton net = ton brut.</li>
            )}
            {m.conventionMayRaise && <li>La convention de l’entreprise peut prévoir plus.</li>}
            <li>C’est un minimum : ça se négocie.</li>
          </ul>
        </section>

        <details className="panel fold salary__grid" aria-labelledby="grid-title">
          <summary className="panel__head fold__head">
            <h2 id="grid-title">{input.contract === 'apprentissage' ? 'La grille de l’apprentissage' : 'La grille du contrat pro'}</h2>
            <span className="panel__meta panel__meta--long">en % du SMIC</span>
          </summary>
          {input.contract === 'apprentissage' ? (
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Âge</th>
                  <th scope="col" className="num">
                    1re année
                  </th>
                  <th scope="col" className="num">
                    2e année
                  </th>
                  <th scope="col" className="num">
                    3e année
                  </th>
                </tr>
              </thead>
              <tbody>
                {APPRENTISSAGE_RATES.map((row) => (
                  <tr key={row.label}>
                    <th scope="row">{row.label}</th>
                    {row.byYear.map((rate, i) => {
                      const here = m.bracket === row.label && input.year === i + 1;
                      return (
                        <td key={i} className="num">
                          <span className={here ? 'hl' : undefined}>{rate} %</span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Âge</th>
                  <th scope="col" className="num">
                    Sans bac pro
                  </th>
                  <th scope="col" className="num">
                    Avec bac pro
                  </th>
                </tr>
              </thead>
              <tbody>
                {PROFESSIONNALISATION_RATES.map((row) => (
                  <tr key={row.label}>
                    <th scope="row">{row.label}</th>
                    {[row.base, row.withBac].map((rate, i) => {
                      const here = m.bracket === row.label && input.hasBacPro === (i === 1);
                      return (
                        <td key={i} className="num">
                          <span className={here ? 'hl' : undefined}>{rate} %</span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {input.contract === 'apprentissage' && (
            <dl className="kv salary__next">
              <div>
                <dt>Sur 12 mois</dt>
                <dd className="num">{formatEuros(m.cents * 12)} brut</dd>
              </div>
              {input.year < 3 && (
                <div>
                  <dt>{ordinal(input.year + 1)} année</dt>
                  <dd className="num">
                    {formatEuros(minimumSalary({ ...input, year: clampYear(input.year + 1) }).cents)} brut par mois (
                    {minimumSalary({ ...input, year: clampYear(input.year + 1) }).rate} % du SMIC)
                  </dd>
                </div>
              )}
              <div>
                <dt>Anniversaire</dt>
                <dd>À 18 et à 21 ans, ton taux monte le 1er jour du mois qui suit ton anniversaire.</dd>
              </div>
            </dl>
          )}
        </details>
      </div>

      <details className="panel fold" aria-labelledby="employer-title">
        <summary className="panel__head fold__head">
          <h2 id="employer-title">Ce que tu coûtes à une entreprise</h2>
          <span className="panel__meta panel__meta--long">la 1re année · contrats conclus en 2026</span>
        </summary>
        <p className="panel__lead">L’argument qui fait mouche en candidature spontanée.</p>
        <div className="employer">
          <div className="employer__controls">
            <label className="ui-field">
              <span className="ui-label">Taille de l’entreprise</span>
              <select className="ui-select" value={size} onChange={(e) => setSize(e.target.value as CompanySize)}>
                <option value="moins-de-250">Moins de 250 salariés</option>
                <option value="250-et-plus">250 salariés et plus</option>
              </select>
            </label>
            <label className="ui-field">
              <span className="ui-label">Diplôme préparé</span>
              <select className="ui-select" value={lvl} onChange={(e) => setLevel(Number(e.target.value) as DiplomaLevel)}>
                {DIPLOMA_LEVELS.map((l) => (
                  <option key={l.level} value={l.level}>
                    {l.label}
                  </option>
                ))}
              </select>
            </label>
            {input.contract === 'apprentissage' && (
              <label className="ui-check">
                <input type="checkbox" checked={disabled} onChange={(e) => setDisabled(e.target.checked)} />
                Je suis reconnu(e) travailleur handicapé
              </label>
            )}
          </div>
          <table className="table employer__table">
            <tbody>
              <tr>
                <th scope="row">Ton salaire minimum sur 12 mois</th>
                <td className="num">{formatEuros(yearly, 0)}</td>
              </tr>
              <tr>
                <th scope="row">
                  {employer.aidLabel}
                  {aid && !aid.verified && <span className="employer__hint"> (estimation, à confirmer auprès de l’ASP)</span>}
                </th>
                <td className="num">{employer.aidCents > 0 ? `−${formatEuros(employer.aidCents, 0)}` : '0 €'}</td>
              </tr>
              <tr>
                <th scope="row">Participation à ta formation (bac+3 et plus)</th>
                <td className="num">{employer.participationCents > 0 ? `+${formatEuros(employer.participationCents, 0)}` : '0 €'}</td>
              </tr>
              <tr className="table__total">
                <th scope="row">Reste pour l’entreprise, hors cotisations patronales</th>
                <td className="num">{formatEuros(remaining, 0)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="message">
          <p className="ui-label">À glisser dans ta candidature spontanée</p>
          <p className="message__text">{pitch}</p>
          <div className="message__foot">
            <span>
              {aid?.verified ? 'Montant maximal : l’aide réelle dépend du contrat signé.' : 'Sans montant : il n’a pas encore été vérifié dans le texte officiel.'}
            </span>
            <CopyButton text={pitch} label="Copier" />
          </div>
        </div>
      </details>

      <details className="panel fold" aria-labelledby="sources-title">
        <summary className="panel__head fold__head">
          <h2 id="sources-title">Sources</h2>
        </summary>
        <ul className="sources">
          <li>SMIC : {SMIC.source}.</li>
          <li>Apprentissage : article D6222-26 du Code du travail. Contrat pro : articles L6325-8 et D6325-15.</li>
          <li>Net d’un apprenti : {APPRENTI_EXEMPTION_SOURCE}.</li>
          {aid && (
            <li>
              {aid.label} (le cas choisi) : {aid.legalRef}. Contrats conclus du {frenchDate(aid.concludedFrom)} au {frenchDate(aid.concludedUntil)}.
              Conditions : {aid.conditions.join(' ; ')}.{!aid.verified && ' Montant relevé dans des synthèses du texte, à confirmer auprès de l’ASP.'}{' '}
              <a className="link" href={aid.sourceUrl} target="_blank" rel="noopener noreferrer">
                Voir la source
              </a>
            </li>
          )}
          <li>
            Toutes les aides du calculateur :{' '}
            {[...new Set(EMPLOYER_AIDS.map((r) => r.legalRef))].join(' ; ')}. L’aide unique concerne les niveaux 3 et 4 (CAP, bac) dans les
            entreprises de moins de 250 salariés ; l’aide exceptionnelle couvre les autres cas.
          </li>
          <li>
            Participation de {formatEuros(EMPLOYER_PARTICIPATION.cents, 0)} (niveaux 6 et 7) : {EMPLOYER_PARTICIPATION.legalRef}.
            {!EMPLOYER_PARTICIPATION.verified && ' À confirmer auprès de l’OPCO.'}
          </li>
        </ul>
      </details>
    </div>
  );
}
