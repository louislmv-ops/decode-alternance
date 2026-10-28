import Link from 'next/link';
import { formatEuros } from '@/lib/format';
import type { PayContext } from '@/lib/offers/pay-estimate';

/**
 * « Ce qui t'attend chez … » : ce qu'en disent les alternants qui y sont passés (avis, salaires déclarés) et le
 * salaire que l'entreprise écrit dans ses autres annonces. Rien d'inventé : sans donnée, la carte le dit et
 * demande un avis.
 */
export function CompanyInsight({ company, context }: { company: string; context: PayContext | null }) {
  const reviews = context?.reviews ?? [];
  const jobs = context?.jobs ?? [];
  const employer = context?.employer ?? null;
  const href = context?.companyHref ?? `/entreprises?q=${encodeURIComponent(company)}`;
  const empty = reviews.length === 0 && jobs.length === 0 && !employer;
  return (
    <section className="panel insight" aria-labelledby="insight-title">
      <div className="panel__head">
        <h2 id="insight-title">Ce qui t’attend chez {company}</h2>
      </div>
      {empty && <p className="panel__note">Personne ne nous a encore raconté l’intérieur. Tant qu’on ne sait pas, on ne dit rien.</p>}
      {reviews.length > 0 && (
        <ul className="pay__reviews">
          {reviews.slice(0, 2).map((r) => (
            <li key={r.id}>
              <p className="pay__review-head">
                <strong>{r.title}</strong> <span className="num">{r.overall}/5</span>
              </p>
              <p className="pay__review-meta">
                {r.jobTitle}, arrivé en {r.startYear}
                {r.verified ? ' · e-mail pro vérifié' : ''}
              </p>
              <p>
                <b>👍</b> {r.pros}
              </p>
              <p>
                <b>👎</b> {r.cons}
              </p>
            </li>
          ))}
        </ul>
      )}
      {jobs.length > 0 && (
        <ul className="pay__jobs">
          {jobs.map((j) => (
            <li key={j.jobTitle}>
              <span>{j.jobTitle}</span>
              <span className="num">
                {j.medianCents !== null ? formatEuros(j.medianCents, 0) : '–'} <small>touchés en vrai, {j.count} alternants</small>
              </span>
            </li>
          ))}
        </ul>
      )}
      {employer && (
        <p className="panel__note">
          💸 Ses {employer.count} annonces qui affichent un salaire donnent {formatEuros(employer.medianCents, 0)} brut par mois en médiane.
        </p>
      )}
      <p className="panel__note" data-needs="comptes">
        <Link className="link" href={href}>
          {context?.companyHref && context.reviewCount > 0 ? `Tous les avis (${context.reviewCount})` : 'T’y as bossé ? Balance ton avis, c’est anonyme'}
        </Link>
      </p>
    </section>
  );
}
