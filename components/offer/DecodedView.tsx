'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useProfile } from '@/components/useProfile';
import { useTracker } from '@/components/useTracker';
import type { Certitude, DecodedOffer } from '@/lib/decode/schema';
import { formatEuros } from '@/lib/format';
import { connectionMessage, teamSearches } from '@/lib/linkedin';
import { RHYTHMS } from '@/lib/profile';
import { comparePay, minimumSalary } from '@/lib/rules/salary';
import { IconOut } from '@/components/app/Icons';
import { CopyButton } from './CopyButton';
import { MatchPanel } from './Match';
import { PayPanel } from './PayPanel';
import type { PayContext } from '@/lib/offers/pay-estimate';
import { OfferFacts } from './OfferFacts';
import type { DiplomaLevel } from '@/lib/rules/employer';

export interface OfferMeta {
  id: string;
  title: string;
  company: string | null;
  city: string | null;
  sourceUrl: string;
  sourceLabel: string;
  salaryCents: number | null;
  schoolFlags: string[];
  isExample: boolean;
  contract: string | null;
  department: string | null;
  diplomaLevel: DiplomaLevel | null;
  /** Salaires déclarés, avis et convention collective de l'entreprise, rassemblés côté serveur. */
  pay?: PayContext | null;
}

const CERTITUDE: Record<Certitude, string> = { dit: 'Dit', deduit: 'Déduit', inconnu: 'Inconnu' };

function Chip({ c }: { c: Certitude }) {
  return <span className={`ui-chip ui-chip--${c}`}>{CERTITUDE[c]}</span>;
}

/** Le rythme de l'offre est-il celui de l'école ? Comparaison prudente, sur la part de temps en entreprise. */
function rhythmVerdict(offerRhythm: string | null, profileRhythm: string | null): { tone: 'ok' | 'warn' | 'unknown'; text: string } {
  if (!offerRhythm) return { tone: 'unknown', text: 'L’annonce ne donne pas le rythme. Demande-le avant de postuler.' };
  const mine = RHYTHMS.find((r) => r.value === profileRhythm);
  if (!mine || mine.value === 'autre') return { tone: 'unknown', text: 'Indique le rythme de ton école dans ton profil pour le comparer.' };
  const nums = offerRhythm.match(/\d+/g)?.map(Number) ?? [];
  const isWeeks = /semaine|mois/i.test(offerRhythm);
  const firstIsCompany = /^\D*\d+\s*(jours?|semaines?|mois)?\s*(en\s+)?entreprise/i.test(offerRhythm);
  if (nums.length < 2) return { tone: 'unknown', text: `Rythme de l’offre : ${offerRhythm}. Vérifie qu’il colle avec ton école.` };
  const [a, b] = nums as [number, number];
  const companyShare = firstIsCompany ? a / (a + b) : b / (a + b);
  const sameUnit = isWeeks === /sem|mois/.test(mine.value);
  const close = Math.abs(companyShare - mine.companyShare) < 0.08;
  if (close && sameUnit) return { tone: 'ok', text: `Compatible avec ton école (${mine.label.toLowerCase()}).` };
  return { tone: 'warn', text: `Différent de ton école (${mine.label.toLowerCase()}). À discuter avec l’entreprise et ton école.` };
}

export function DecodedView({ decoded, offer }: { decoded: DecodedOffer; offer: OfferMeta | null }) {
  const [profile] = useProfile();
  const { add, apps } = useTracker();
  const [added, setAdded] = useState(false);

  const minimum = minimumSalary({ contract: profile.contract, age: profile.age, year: profile.year, hasBacPro: profile.hasBacPro });
  const offerCents = offer?.salaryCents ?? (decoded.salaire.mensuelBrutEuros !== null ? Math.round(decoded.salaire.mensuelBrutEuros * 100) : null);
  const pay = offerCents !== null ? comparePay(offerCents, minimum.cents) : null;
  const big = decoded.entreprise.taille === 'grande';
  const alerts = [
    ...decoded.alertes,
    ...(pay?.verdict === 'sous-le-minimum' ? [{ niveau: 'alerte' as const, texte: `Le salaire annoncé est sous ton minimum légal (${formatEuros(minimum.cents)}).` }] : []),
  ];
  const schoolBait = alerts.some((a) => a.niveau === 'alerte') || (offer?.schoolFlags.length ?? 0) > 0;
  const company = decoded.entreprise.nom ?? offer?.company ?? '';
  const rhythm = rhythmVerdict(decoded.contrat.rythme, profile.rhythm);
  const searches = teamSearches({
    company,
    service: decoded.equipe.motsCles[0] ?? decoded.equipe.service,
    city: decoded.lieu.ville ?? offer?.city ?? '',
    school: profile.school,
  });
  const message = decoded.message
    .replace('[TON PRÉNOM]', profile.firstName || '[TON PRÉNOM]')
    .replace('[TA FORMATION]', profile.school || '[TA FORMATION]');
  const fallbackMessage = connectionMessage({ company, service: decoded.equipe.service, city: '', school: '', firstName: profile.firstName, formation: profile.school });
  const alreadyTracked = Boolean(offer && apps.some((a) => a.url === offer.sourceUrl && a.company === company)) || added;
  const realSource = offer && /^https?:\/\//.test(offer.sourceUrl);

  const meta = [company || 'Entreprise non nommée', offer?.sourceLabel]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="screen">
      <div className="title-row">
        <div>
          <h1>{decoded.intitule}</h1>
          <p className="title-row__sub">{meta}</p>
        </div>
        <div className="title-row__actions">
          <button
            type="button"
            className="ui-btn"
            disabled={alreadyTracked}
            onClick={() => {
              add({
                company: company || 'Entreprise non nommée',
                title: decoded.intitule,
                url: realSource ? offer!.sourceUrl : '',
                channel: 'offre',
                status: 'a-envoyer',
                sentAt: null,
                followedUpAt: null,
                notes: '',
              });
              setAdded(true);
            }}
          >
            {alreadyTracked ? 'Dans ton suivi' : 'Ajouter à mon suivi'}
          </button>
          {realSource && (
            <a className="ui-btn ui-btn--primary" href={offer!.sourceUrl} target="_blank" rel="noopener noreferrer">
              Postuler sur le site d’origine <IconOut />
            </a>
          )}
        </div>
      </div>

      {offer?.isExample && <p className="notice">Exemple fictif.</p>}

      <OfferFacts
        payCents={offerCents}
        minimumCents={minimum.cents}
        community={offer?.pay ?? null}
        company={company || null}
        place={[decoded.lieu.ville ?? offer?.city, decoded.lieu.precision].filter(Boolean).join(', ') || null}
        rhythm={decoded.contrat.rythme}
        contract={[decoded.contrat.type === 'apprentissage' ? 'Apprentissage' : decoded.contrat.type === 'professionnalisation' ? 'Contrat pro' : offer?.contract, decoded.contrat.duree].filter(Boolean).join(' · ') || null}
      />
      {offer && <MatchPanel offer={{ title: offer.title, department: offer.department, diplomaLevel: offer.diplomaLevel }} />}

      <div className="detail">
        <div className="detail__main">
          <section className="panel panel--lead" aria-labelledby="clair-title">
            <h2 id="clair-title" className="brief-title">
              En bref
            </h2>
            <p className="lead-text">{decoded.enClair}</p>
            <ul className="brief" role="list">
              {decoded.missions.slice(0, 3).map((m, i) => (
                <li key={i}>{m.enClair}</li>
              ))}
            </ul>
            {(big || pay?.verdict === 'bien-paye' || schoolBait) && (
              <div className="tags">
                {big && !schoolBait && <span className="pepite stroke">Grande entreprise</span>}
                {pay?.verdict === 'bien-paye' && !schoolBait && <span className="pepite stroke">+{pay.diffPercent} % au-dessus de ton minimum</span>}
                {schoolBait && <span className="pill pill--alert">À vérifier avant de postuler</span>}
              </div>
            )}
            {decoded.entreprise.ceQuElleFait && <p className="lead-sub">{decoded.entreprise.ceQuElleFait}</p>}
          </section>

          <details className="panel fold" aria-labelledby="missions-title">
            <summary className="panel__head fold__head">
              <h2 id="missions-title">Les missions, traduites</h2>
              <span className="panel__meta">{decoded.missions.length} missions</span>
            </summary>
            <ul className="missions" role="list">
              {decoded.missions.map((m, i) => (
                <li key={i}>
                  {m.jargon && <s className="ui-jargon">{m.jargon}</s>}
                  <span className="ui-plain">{m.enClair}</span>
                  <Chip c={m.certitude} />
                </li>
              ))}
            </ul>
          </details>

          <details className="panel fold" aria-labelledby="semaine-title">
            <summary className="panel__head fold__head">
              <h2 id="semaine-title">Ta semaine probable</h2>
              <Chip c="deduit" />
            </summary>
            <dl className="week">
              {decoded.semaineType.map((s, i) => (
                <div key={i}>
                  <dt>{s.moment}</dt>
                  <dd>{s.activite}</dd>
                </div>
              ))}
            </dl>
          </details>

          <section className="panel" aria-labelledby="learn-title">
            <div className="split">
              <div>
                <div className="panel__head">
                  <h2 id="learn-title">Ce que tu vas apprendre</h2>
                </div>
                <ul className="bullets">
                  {decoded.apprentissages.map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="panel__head">
                  <h2>Points forts, points faibles</h2>
                </div>
                {decoded.pointsForts.length > 0 && (
                  <ul className="bullets">
                    {decoded.pointsForts.map((x, i) => (
                      <li key={i}>{x}</li>
                    ))}
                  </ul>
                )}
                {decoded.limites.length > 0 && (
                  <ul className="bullets bullets--ink limits">
                    {decoded.limites.map((x, i) => (
                      <li key={i}>{x}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>

          <details className="panel fold" aria-labelledby="questions-title">
            <summary className="panel__head fold__head">
              <h2 id="questions-title">Questions à poser</h2>
              <CopyButton text={decoded.questionsAPoser.map((q) => `- ${q}`).join('\n')} label="Copier les questions" />
            </summary>
            <ul className="questions" role="list">
              {decoded.questionsAPoser.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ul>
            {decoded.nonPrecise.length > 0 && (
              <p className="panel__note">
                <strong>L’annonce ne dit pas :</strong> {decoded.nonPrecise.join(' · ')}
              </p>
            )}
          </details>

          {decoded.jargon.length > 0 && (
            <details className="panel fold" aria-labelledby="jargon-title">
              <summary className="panel__head fold__head">
                <h2 id="jargon-title">Le jargon traduit</h2>
              </summary>
              <dl className="glossary">
                {decoded.jargon.map((j, i) => (
                  <div key={i}>
                    <dt>« {j.expression} »</dt>
                    <dd>{j.traduction}</dd>
                  </div>
                ))}
              </dl>
            </details>
          )}
        </div>

        <aside className="detail__rail" aria-label="Vérifications et contacts">
          {alerts.length > 0 && (
            <section className="panel panel--alert" aria-labelledby="alert-title">
              <h2 id="alert-title">À vérifier</h2>
              <ul className="alerts" role="list">
                {alerts.map((a, i) => (
                  <li key={i} className={`alerts__item alerts__item--${a.niveau}`}>
                    {a.texte}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {decoded.aMettreEnAvant.length > 0 && (
            <section className="panel" aria-labelledby="cv-title">
              <div className="panel__head">
                <h2 id="cv-title">Fais la différence</h2>
              </div>
              <ul className="bullets">
                {decoded.aMettreEnAvant.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            </section>
          )}
          {company && decoded.equipe.aContacter.length > 0 && (
            <section className="panel" aria-labelledby="team-title">
              <div className="panel__head">
                <h2 id="team-title">Trouve qui contacter</h2>
              </div>
              <p className="panel__note panel__note--first">
                Service à viser : <strong>{decoded.equipe.service}</strong>
              </p>
              <ul className="bullets team-roles">
                {decoded.equipe.aContacter.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
              <ul className="search-links" role="list">
                {searches.slice(0, 3).map((s) => (
                  <li key={s.url}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="search-link">
                      <span>{s.label}</span>
                      <IconOut />
                    </a>
                  </li>
                ))}
              </ul>
              <div className="message">
                <p className="ui-label">Message à adapter</p>
                <p className="message__text">{message || fallbackMessage}</p>
                <div className="message__foot">
                  <span className="num">{(message || fallbackMessage).length} / 300</span>
                  <CopyButton text={message || fallbackMessage} label="Copier le message" />
                </div>
              </div>
              <Link
                className="panel__link"
                href={`/equipe?entreprise=${encodeURIComponent(company)}&service=${encodeURIComponent(decoded.equipe.motsCles[0] ?? decoded.equipe.service)}&ville=${encodeURIComponent(decoded.lieu.ville ?? '')}`}
              >
                Toute la méthode pour cette entreprise
              </Link>
            </section>
          )}

          <PayPanel
            announcedCents={offerCents}
            context={offer?.pay ?? null}
            company={company || null}
            sourceLabel={offer?.sourceLabel ?? 'l’annonce'}
            perks={decoded.salaire.avantages}
          />

          <details className="panel fold" aria-labelledby="contract-title">
            <summary className="panel__head fold__head">
              <h2 id="contract-title">Contrat et rythme</h2>
            </summary>
            <dl className="kv">
              <div>
                <dt>Diplôme</dt>
                <dd>{decoded.contrat.diplome ?? '–'}</dd>
              </div>
              <div>
                <dt>Durée</dt>
                <dd>{decoded.contrat.duree ?? '–'}</dd>
              </div>
              <div>
                <dt>Début</dt>
                <dd>{decoded.contrat.debut ?? '–'}</dd>
              </div>
              <div>
                <dt>Rythme</dt>
                <dd>{decoded.contrat.rythme ?? '–'}</dd>
              </div>
              <div>
                <dt>Lieu</dt>
                <dd>{[decoded.lieu.ville, decoded.lieu.precision].filter(Boolean).join(', ') || '–'}</dd>
              </div>
              {decoded.lieu.teletravail && (
                <div>
                  <dt>Télétravail</dt>
                  <dd>{decoded.lieu.teletravail}</dd>
                </div>
              )}
            </dl>
            <p className={`ui-status ui-status--${rhythm.tone}`}>{rhythm.text}</p>
          </details>

        </aside>
      </div>
      <p className="screen__foot">
        {offer?.isExample ? 'Exemple rédigé à la main.' : 'Traduit par une IA : vérifie l’essentiel avec l’entreprise.'}{' '}
        Décode ne garantit ni contrat, ni entretien, ni réponse.
      </p>
    </div>
  );
}
