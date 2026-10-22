import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { BackLink } from '@/components/BackLink';
import { CampaignCard } from '@/components/campaigns/CampaignCard';
import { Contribute } from '@/components/companies/Contribute';
import { ReviewCard } from '@/components/companies/ReviewCard';
import { Score } from '@/components/companies/Stars';
import { companyBySiren, type CompanyRef } from '@/lib/companies/search';
import { type CompanyPage, companyPage, CRITERIA, MIN_TO_SHOW } from '@/lib/companies/store';
import { isCommunityOpen } from '@/lib/community/http';
import { formatEuros } from '@/lib/format';
import { listOffers } from '@/lib/offers/repository';
import type { Offer } from '@/lib/offers/types';
import { type Campaign, campaignsForSiren } from '@/lib/recruiters/campaigns';

type Props = { params: Promise<{ siren: string }> };

async function load(siren: string): Promise<{ company: CompanyRef; page: CompanyPage | null } | null> {
  if (!/^\d{9}$/.test(siren)) return null;
  const page = isCommunityOpen() ? await companyPage(siren).catch(() => null) : null;
  if (page) return { company: page.company, page };
  const company = await companyBySiren(siren).catch(() => null);
  return company ? { company, page: null } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await load((await params).siren);
  if (!data) return { title: 'Entreprise introuvable' };
  return {
    title: `${data.company.name} : avis et salaires des alternants`,
    description: `Salaire réel des alternants chez ${data.company.name}, comparé au minimum légal, et leurs avis sur le tuteur, les missions et le rythme école.`,
  };
}

/** Les offres de cette entreprise, retrouvées par son nom (les offres n'ont pas toujours de SIREN). */
async function offersOf(name: string): Promise<Offer[]> {
  const short = name.replace(/\s*\(.*\)\s*$/, '').trim();
  const page = await listOffers({ q: short }).catch(() => null);
  const key = short.toLowerCase();
  return (page?.offers ?? []).filter((o) => o.company?.toLowerCase().includes(key)).slice(0, 4);
}

export default async function CompanyPageView({ params }: Props) {
  await connection();
  const { siren } = await params;
  const data = await load(siren);
  if (!data) notFound();
  const { company, page } = data;
  const [offers, campaigns] = await Promise.all([
    offersOf(company.name),
    isCommunityOpen() ? campaignsForSiren(siren).catch((): Campaign[] => []) : Promise.resolve([] as Campaign[]),
  ]);
  const s = page?.salaries;
  const r = page?.reviews;

  return (
    <div className="screen c-screen">
      <div className="back-row">
        <BackLink fallback="/entreprises" label="Entreprises" />
      </div>
      <div className="c-main">
        <header className="e-head">
          <h1 className="c-charte__title">{company.name}</h1>
          <p className="c-post__meta">{[company.city, `SIREN ${company.siren}`].filter(Boolean).join(' · ')}</p>
          {r?.overall != null && (
            <p className="e-head__score">
              <Score value={r.overall} label="Note globale" /> <span className="c-post__meta">{r.count} avis</span>
            </p>
          )}
        </header>

        <section className="e-block" aria-labelledby="salaires">
          <h2 id="salaires">Salaire des alternants</h2>
          {s?.medianCents != null ? (
            <>
              <p className="e-big num">
                {formatEuros(s.medianCents, 0)} <span>brut/mois, médiane</span>
              </p>
              {s.aboveMinimumPercent !== null && (
                <p className={`e-vs${s.aboveMinimumPercent < 0 ? ' is-low' : ''}`}>
                  {s.aboveMinimumPercent > 0
                    ? `${s.aboveMinimumPercent} % au-dessus du minimum légal`
                    : s.aboveMinimumPercent === 0
                      ? 'Au minimum légal'
                      : `${-s.aboveMinimumPercent} % sous le minimum légal`}
                </p>
              )}
              {s.belowMinimum > 0 && (
                <p className="c-note">
                  {s.belowMinimum} déclaration{s.belowMinimum > 1 ? 's' : ''} sous le minimum légal. <Link href="/salaire">Vérifie le tien</Link>.
                </p>
              )}
              {s.jobs.length > 0 && (
                <ul className="e-jobs" role="list">
                  {s.jobs.map((j) => (
                    <li key={j.jobTitle}>
                      <span>{j.jobTitle}</span>
                      <span className="num">{j.medianCents ? formatEuros(j.medianCents, 0) : ''}</span>
                    </li>
                  ))}
                </ul>
              )}
              <p className="c-post__meta">{s.count} déclarations</p>
            </>
          ) : (
            <p className="c-empty e-empty">
              {s?.count ? `${s.count} déclaration${s.count > 1 ? 's' : ''}. ` : ''}Il en faut {MIN_TO_SHOW} pour afficher une médiane.
            </p>
          )}
        </section>

        <section className="e-block" aria-labelledby="avis">
          <h2 id="avis">Avis</h2>
          {r?.overall != null ? (
            <ul className="e-criteria" role="list">
              {CRITERIA.map(([key, label]) => (
                <li key={key}>
                  <span>{label}</span>
                  <Score value={r.criteria[key]} label={label} />
                </li>
              ))}
              {r.hiredPercent !== null && (
                <li>
                  <span>Embauche proposée à la fin</span>
                  <strong className="num">{r.hiredPercent} %</strong>
                </li>
              )}
            </ul>
          ) : (
            <p className="c-empty e-empty">
              {r?.count ? `${r.count} avis. ` : ''}Les notes s’affichent à partir de {MIN_TO_SHOW} avis.
            </p>
          )}
          {page?.list.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </section>

        {isCommunityOpen() && <Contribute siren={company.siren} name={company.name} />}

        {campaigns.length > 0 && (
          <section className="e-block">
            <h2>Campagnes en cours</h2>
            <div className="k-list">
              {campaigns.map((c) => (
                <CampaignCard key={c.id} campaign={c} />
              ))}
            </div>
          </section>
        )}

        {offers.length > 0 && (
          <section className="e-block">
            <h2>Leurs offres</h2>
            <ul className="e-results" role="list">
              {offers.map((o) => (
                <li key={o.id}>
                  <Link href={`/offres/${encodeURIComponent(o.id)}`}>
                    <strong>{o.title}</strong>
                    <span>{o.city ?? ''}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
