'use client';

import Link from 'next/link';
import { useProfile } from '@/components/useProfile';
import { formatEuros, formatPay } from '@/lib/format';
import { type PayContext, payEstimate } from '@/lib/offers/pay-estimate';
import { payDisplay } from '@/lib/offers/pay-display';
import { SMIC } from '@/lib/rules/reference';
import { apprenticeNetThresholdCents, comparePay, CONTRACT_NAMES, contractForOffer, minimumSalary } from '@/lib/rules/salary';
import { conventionLink } from '@/lib/rules/conventions';

/**
 * La paie d'une offre, en entier : le chiffre retenu et d'où il vient, la fourchette des alternants
 * de l'entreprise, leurs avis, la grille légale sur toute la durée du contrat, la convention collective.
 */
export function PayPanel({
  announcedCents,
  announcedMaxCents = null,
  context,
  company,
  sourceLabel,
  perks = [],
  offerContract = null,
  folded = false,
}: {
  announcedCents: number | null;
  /** Haut de la fourchette annoncée, ou plafond d'un « jusqu'à » : jamais présenté comme le salaire. */
  announcedMaxCents?: number | null;
  context: PayContext | null;
  company: string | null;
  sourceLabel: string;
  perks?: string[];
  /** Le contrat de l'offre quand elle le précise : c'est lui qui fixe le minimum légal. */
  offerContract?: 'apprentissage' | 'professionnalisation' | 'alternance' | null;
  /** Replié derrière son titre : la fiche montre déjà la paie en haut. */
  folded?: boolean;
}) {
  const [profile] = useProfile();
  const contract = contractForOffer(offerContract, profile.contract);
  const fromOffer = offerContract === 'apprentissage' || offerContract === 'professionnalisation';
  const minimum = minimumSalary({ contract, age: profile.age, year: profile.year, hasBacPro: profile.hasBacPro });
  const e = payEstimate(announcedCents, minimum.cents, context?.community ?? null, context?.legalGrid ?? false, context?.employer ?? null);
  const shown = payDisplay(e, minimum.cents);
  const pay = announcedCents !== null ? comparePay(announcedCents, minimum.cents) : null;
  const years = ([1, 2, 3] as const).map((year) => minimumSalary({ contract: 'apprentissage', age: profile.age, year, hasBacPro: profile.hasBacPro }));
  const jobs = context?.jobs ?? [];
  const reviews = context?.reviews ?? [];

  const link = (
    <Link href="/profil" className="panel__link">
      {profile.age} ans, {profile.year}
      {profile.year === 1 ? 're' : 'e'} année, {CONTRACT_NAMES[contract]}
    </Link>
  );
  const content = (
    <>

      <div className="pay">
        <div>
          <p className="ui-label">
            {e.source === 'annonce' ? (announcedMaxCents ? 'Fourchette annoncée' : 'Dans l’annonce') : 'Sans chiffre garanti'}
          </p>
          {e.source === 'annonce' ? (
            <p className="pay__figure num">{formatPay(e.cents, announcedMaxCents)}</p>
          ) : (
            <p className={`pay__figure pay__figure--word pay__figure--${shown.tier ?? 'none'}`}>{shown.word}</p>
          )}
          <p className="pay__src">
            {e.source === 'annonce'
              ? `brut par mois, dans l’annonce (${sourceLabel})`
              : announcedMaxCents
                ? `l’annonce dit « jusqu’à ${formatEuros(announcedMaxCents, 0)} » sans montant garanti : compte sur ton minimum légal`
              : e.source === 'alternants'
                ? `tendance d’après ${e.count} alternants de cette entreprise`
                : e.source === 'entreprise'
                  ? `pas de montant ici, mais ${e.count} autres offres de cette entreprise affichent ${formatEuros(e.cents, 0)} en médiane`
                  : e.legalGrid
                    ? 'l’annonce renvoie à la grille légale'
                    : 'pas de montant dans l’annonce : c’est ton minimum légal'}
          </p>
        </div>
        <div>
          <p className="ui-label">Ton minimum légal ({CONTRACT_NAMES[contract]})</p>
          <p className="pay__figure pay__figure--min num">{formatEuros(minimum.cents, 0)}</p>
        </div>
      </div>

      {announcedCents !== null && (
        <div className="bullet-bar" aria-hidden="true">
          <span className="bullet-bar__fill" style={{ width: `${Math.min(100, (announcedCents / Math.max(announcedCents, minimum.cents)) * 100)}%` }} />
          <span className="bullet-bar__tick" style={{ left: `${Math.min(100, (minimum.cents / Math.max(announcedCents, minimum.cents)) * 100)}%` }} />
        </div>
      )}

      <p className="panel__note">
        {pay
          ? pay.verdict === 'sous-le-minimum'
            ? 'Sous le minimum légal : l’employeur doit payer au moins ton minimum.'
            : pay.diffPercent > 0
              ? `${announcedMaxCents ? 'Au moins ' : ''}${formatEuros(pay.diffCents, 0)} de plus que ton minimum, soit +${pay.diffPercent} %.`
              : 'Payé au minimum légal.'
          : e.source === 'alternants' || e.source === 'entreprise'
            ? 'Une tendance, pas un montant. Jamais sous ton minimum.'
            : 'Jamais moins. Demande le montant exact en entretien.'}{' '}
        {contract === 'apprentissage' && `En apprentissage, sous ${formatEuros(apprenticeNetThresholdCents(), 0)} brut, ton net est égal à ton brut.`}
      </p>
      {perks.length > 0 && <p className="panel__note">En plus : {perks.join(' · ')}</p>}

      <details className="fold pay__more">
        <summary className="fold__head">
          <span className="pay__h">Le détail du calcul</span>
        </summary>
      <p className="panel__note">
        {fromOffer
          ? `Base SMIC, ${contract === 'apprentissage' ? 'apprentissage' : 'contrat pro'} (d’après l’offre).`
          : `Base SMIC, ${contract === 'apprentissage' ? 'apprentissage' : 'contrat pro'} (d’après ton profil).`}{' '}
        {minimum.conventionMayRaise
          ? contract === 'apprentissage'
            ? 'Ta convention collective peut monter ce minimum.'
            : 'Ta convention collective peut monter ce minimum (85 % de son SMC).'
          : 'Certaines conventions (banque, BTP, Syntec…) paient plus.'}
      </p>
      {contract === 'apprentissage' && (
        <>
          <h3 className="pay__h">Sur toute la durée de ton apprentissage (base SMIC)</h3>
          <dl className="pay__years">
            {years.map((y, i) => (
              <div key={i}>
                <dt>{i + 1 === 1 ? '1re' : `${i + 1}e`} année</dt>
                <dd className="num">
                  {formatEuros(y.cents, 0)} <span>{y.rate} % du SMIC</span>
                </dd>
              </div>
            ))}
          </dl>
        </>
      )}

      </details>

      <h3 className="pay__h">Ce qu’en disent les alternants</h3>
      {jobs.length > 0 && (
        <ul className="pay__jobs">
          {jobs.map((j) => (
            <li key={j.jobTitle}>
              <span>{j.jobTitle}</span>
              <span className="num">
                {j.medianCents !== null ? formatEuros(j.medianCents, 0) : '–'} <small>médiane, {j.count} déclarations</small>
              </span>
            </li>
          ))}
        </ul>
      )}
      {reviews.length > 0 && (
        <ul className="pay__reviews">
          {reviews.map((r) => (
            <li key={r.id}>
              <p className="pay__review-head">
                <strong>{r.title}</strong> <span className="num">{r.overall}/5</span>
              </p>
              <p className="pay__review-meta">
                {r.jobTitle}, contrat commencé en {r.startYear}
                {r.verified ? ' · e-mail pro vérifié' : ''}
              </p>
              <p>
                <b>Plus :</b> {r.pros}
              </p>
              <p>
                <b>Moins :</b> {r.cons}
              </p>
            </li>
          ))}
        </ul>
      )}
      {jobs.length === 0 && reviews.length === 0 && (
        <p className="panel__note">
          {e.source === 'alternants'
            ? 'Les déclarations existent mais aucun poste n’en a encore assez pour être détaillé.'
            : 'Aucun alternant n’a encore déclaré son salaire ni laissé d’avis sur cette entreprise.'}
        </p>
      )}
      {company && (
        <p className="panel__note" data-needs="comptes">
          <Link className="link" href={context?.companyHref ?? `/entreprises?q=${encodeURIComponent(company)}`}>
            {context?.companyHref ? `Tous les avis et salaires (${context.reviewCount} avis)` : 'Tu y es passé ? Déclare ton salaire, anonymement'}
          </Link>
        </p>
      )}

      <details className="fold pay__more">
        <summary className="fold__head">
          <span className="pay__h">Convention collective et sources</span>
        </summary>
      {(context?.conventions.length ?? 0) > 0 && (
        <>
          <h3 className="pay__h">Convention collective</h3>
          <p className="panel__note">
            {context!.conventions.map((c, i) => (
              <span key={c.idcc}>
                {i > 0 && ', '}
                <a className="link" href={conventionLink(c.idcc)} target="_blank" rel="noopener noreferrer">
                  {c.name ? `${c.name} (IDCC ${c.idcc})` : `IDCC ${c.idcc}`}
                </a>
              </span>
            ))}
            . Si elle fixe un salaire minimum conventionnel (SMC) plus élevé que le SMIC, ou une grille propre aux alternants, ton salaire
            minimum est calculé dessus : vérifie la grille avant de signer.
          </p>
        </>
      )}

      <h3 className="pay__h">Sources</h3>
      <ul className="pay__sources">
        <li>{announcedCents !== null ? `Montant : l’annonce, publiée sur ${sourceLabel}.` : `L’annonce (${sourceLabel}) ne donne pas de montant chiffré.`}</li>
        {context?.community && <li>Estimation : {context.community.count} salaires déclarés anonymement sur Décode par des alternants de cette entreprise.</li>}
        <li>
          Minimum légal : article D6222-26 du Code du travail (apprentissage), articles L6325-8 et D6325-15 (contrat pro). SMIC de{' '}
          {formatEuros(SMIC.monthlyCents, 2)} brut par mois, {SMIC.source}.
        </li>
        {(context?.conventions.length ?? 0) > 0 && (
          <li>Convention collective : annuaire des entreprises (recherche-entreprises.api.gouv.fr), d’après les déclarations de l’employeur.</li>
        )}
      </ul>
      </details>
    </>
  );
  if (folded) {
    return (
      <details className="panel fold" aria-labelledby="pay-title">
        <summary className="panel__head fold__head">
          <h2 id="pay-title">Salaire en détail</h2>
        </summary>
        <p className="panel__note">{link}</p>
        {content}
      </details>
    );
  }
  return (
    <section className="panel" aria-labelledby="pay-title">
      <div className="panel__head">
        <h2 id="pay-title">Salaire</h2>
        {link}
      </div>
      {content}
    </section>
  );
}
