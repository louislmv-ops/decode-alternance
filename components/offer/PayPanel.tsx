'use client';

import Link from 'next/link';
import { useProfile } from '@/components/useProfile';
import { formatEuros } from '@/lib/format';
import { type PayContext, payEstimate } from '@/lib/offers/pay-estimate';
import { SMIC } from '@/lib/rules/reference';
import { apprenticeNetThresholdCents, comparePay, CONTRACT_NAMES, contractForOffer, minimumSalary } from '@/lib/rules/salary';
import { conventionLink } from '@/lib/rules/conventions';

/**
 * La paie d'une offre, en entier : le chiffre retenu et d'où il vient, la fourchette des alternants
 * de l'entreprise, leurs avis, la grille légale sur toute la durée du contrat, la convention collective.
 */
export function PayPanel({
  announcedCents,
  context,
  company,
  sourceLabel,
  perks = [],
  offerContract = null,
}: {
  announcedCents: number | null;
  context: PayContext | null;
  company: string | null;
  sourceLabel: string;
  perks?: string[];
  /** Le contrat de l'offre quand elle le précise : c'est lui qui fixe le minimum légal. */
  offerContract?: 'apprentissage' | 'professionnalisation' | 'alternance' | null;
}) {
  const [profile] = useProfile();
  const contract = contractForOffer(offerContract, profile.contract);
  const fromOffer = offerContract === 'apprentissage' || offerContract === 'professionnalisation';
  const minimum = minimumSalary({ contract, age: profile.age, year: profile.year, hasBacPro: profile.hasBacPro });
  const e = payEstimate(announcedCents, minimum.cents, context?.community ?? null, context?.legalGrid ?? false);
  const pay = announcedCents !== null ? comparePay(announcedCents, minimum.cents) : null;
  const years = ([1, 2, 3] as const).map((year) => minimumSalary({ contract: 'apprentissage', age: profile.age, year, hasBacPro: profile.hasBacPro }));
  const jobs = context?.jobs ?? [];
  const reviews = context?.reviews ?? [];

  return (
    <section className="panel" aria-labelledby="pay-title">
      <div className="panel__head">
        <h2 id="pay-title">Salaire</h2>
        <Link href="/profil" className="panel__link">
          {profile.age} ans, {profile.year}
          {profile.year === 1 ? 're' : 'e'} année, {CONTRACT_NAMES[contract]}
        </Link>
      </div>

      <div className="pay">
        <div>
          <p className="ui-label">{e.source === 'annonce' ? 'Annoncé' : e.source === 'alternants' ? 'Estimé pour toi' : 'Au moins'}</p>
          <p className="pay__figure num">
            {e.source === 'alternants' && '≈ '}
            {formatEuros(e.cents, 0)}
          </p>
          <p className="pay__src">
            {e.source === 'annonce'
              ? `brut par mois, dans l’annonce (${sourceLabel})`
              : e.source === 'alternants'
                ? `d’après ${e.count} alternants de cette entreprise`
                : e.legalGrid
                  ? 'l’annonce renvoie à la grille légale'
                  : 'pas de montant dans l’annonce : c’est ton minimum légal'}
          </p>
        </div>
        {e.source !== 'minimum' && (
          <div>
            <p className="ui-label">Ton minimum légal ({CONTRACT_NAMES[contract]})</p>
            <p className="pay__figure pay__figure--min num">{formatEuros(minimum.cents, 0)}</p>
          </div>
        )}
      </div>

      {e.lowCents !== null && e.highCents !== null && (
        <p className="pay__range num">
          Fourchette : <strong>{formatEuros(e.lowCents, 0)}</strong> à <strong>{formatEuros(e.highCents, 0)}</strong> brut par mois
          <span> (la moitié des déclarations se trouve dans cet écart, ramené à ton âge et ton année)</span>
        </p>
      )}

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
              ? `${formatEuros(pay.diffCents)} de plus que ton minimum, soit +${pay.diffPercent} %.`
              : 'Payé au minimum légal.'
          : e.source === 'alternants'
            ? `C’est une estimation : pose la question du salaire exact à l’entretien. Il ne peut pas être sous ${formatEuros(minimum.cents, 0)}.`
            : 'L’employeur ne peut pas payer moins. Pose la question du salaire exact à l’entretien.'}{' '}
        {contract === 'apprentissage' && `En apprentissage, sous ${formatEuros(apprenticeNetThresholdCents(), 0)} brut, ton net est égal à ton brut.`}
      </p>
      <p className="panel__note">
        {fromOffer
          ? `Minimum calculé pour un ${contract === 'apprentissage' ? 'contrat d’apprentissage' : 'contrat de professionnalisation'}, comme l’indique l’offre, sur la base du SMIC.`
          : `L’offre ne précise pas le contrat (apprentissage ou contrat pro) : minimum calculé pour un ${contract === 'apprentissage' ? 'contrat d’apprentissage' : 'contrat de professionnalisation'}, comme dans ton profil, sur la base du SMIC.`}{' '}
        {minimum.conventionMayRaise
          ? contract === 'apprentissage'
            ? 'À ton âge, si la convention collective fixe pour ton poste un salaire minimum (SMC) supérieur au SMIC, c’est lui qui sert de base : ton minimum peut être plus haut.'
            : 'À ton âge, tu as droit au plus élevé entre le SMIC et 85 % du salaire minimum de ta convention collective (SMC) : ton minimum peut être plus haut.'
          : 'Certaines conventions (banque, BTP, Syntec…) ont leur propre grille d’alternants, plus favorable : ton minimum peut être plus haut.'}
      </p>
      {perks.length > 0 && <p className="panel__note">En plus : {perks.join(' · ')}</p>}

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
    </section>
  );
}
