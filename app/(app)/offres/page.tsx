import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { CampaignStrip } from '@/components/campaigns/CampaignStrip';
import { AutoSubmit } from '@/components/offer/AutoSubmit';
import { ForYou } from '@/components/offer/ForYou';
import { OfferRow } from '@/components/offer/OfferRow';
import { DEPARTMENT_OPTIONS } from '@/lib/departments';
import { decodePayCookie, PROFILE_COOKIE } from '@/lib/profile';
import { DIPLOMA_LEVELS } from '@/lib/rules/employer';
import { parseFilters } from '@/lib/offers/filter';
import { highlights } from '@/lib/offers/highlights';
import { listOffers } from '@/lib/offers/repository';
import type { OfferFilters } from '@/lib/offers/types';

export const metadata: Metadata = {
  title: 'Offres d’alternance',
  description: 'Les offres d’alternance avec leur paie notée en €, ton salaire minimum comparé et les offres d’écoles écartées.',
};

function pageHref(filters: OfferFilters, page: number): string {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.department) params.set('dep', filters.department);
  if (filters.level) params.set('niveau', String(filters.level));
  if (filters.contract) params.set('contrat', filters.contract);
  if (filters.bigCompany) params.set('grandes', '1');
  if (filters.direct) params.set('direct', '1');
  if (page > 1) params.set('page', String(page));
  const qs = params.toString();
  return qs ? `/offres?${qs}` : '/offres';
}

export default async function OffersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const filters = parseFilters(await searchParams);
  const profile = decodePayCookie((await cookies()).get(PROFILE_COOKIE)?.value);
  const result = await listOffers(filters);
  const rows = result.offers.map((offer) => ({ offer, h: highlights(offer, profile) }));
  const pepites = rows.filter((r) => r.h.pepite).length;
  const from = result.total === 0 ? 0 : (result.page - 1) * result.pageSize + 1;
  const to = Math.min(result.total, result.page * result.pageSize);
  const pages = Math.min(result.maxPage ?? Infinity, Math.max(1, Math.ceil(result.total / result.pageSize)));

  return (
    <div className="screen offers">
      <header className="offers__head">
        <h1>
          Trouve ton alternance<span>.</span>
        </h1>
        <p className="offers__count">
          <strong className="num">{result.total.toLocaleString('fr-FR')}</strong> offre{result.total > 1 ? 's' : ''}
          {pepites > 0 && (
            <>
              {' '}
              dont <span className="hl">{pepites} pépite{pepites > 1 ? 's' : ''}</span>
            </>
          )}
          {result.mode === 'exemples' && <span className="offers__demo"> · exemples fictifs pour l’instant</span>}
        </p>
      </header>

      <form id="osearch" className="osearch" action="/offres" method="get" role="search">
        <div className="osearch__bar">
          <label className="osearch__field">
            <span className="sr-only">Métier, entreprise ou ville</span>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <circle cx="9" cy="9" r="6" />
              <path d="M13.5 13.5L17 17" strokeLinecap="round" />
            </svg>
            <input type="search" name="q" defaultValue={filters.q} placeholder="Métier, entreprise, ville" />
          </label>
          <button type="submit" className="osearch__go">
            Rechercher
          </button>
        </div>
        <div className="osearch__chips">
          <label className={`chip${filters.department ? ' is-on' : ''}`}>
            <span className="sr-only">Département</span>
            <select name="dep" defaultValue={filters.department ?? ''}>
              <option value="">Toute la France</option>
              {DEPARTMENT_OPTIONS.map((d) => (
                <option key={d.code} value={d.code}>
                  {d.code} · {d.name}
                </option>
              ))}
            </select>
          </label>
          <label className={`chip${filters.level ? ' is-on' : ''}`}>
            <span className="sr-only">Ton niveau de diplôme</span>
            <select name="niveau" defaultValue={filters.level ? String(filters.level) : ''}>
              <option value="">Tous niveaux</option>
              {DIPLOMA_LEVELS.map((l) => (
                <option key={l.level} value={l.level}>
                  Jusqu’à {l.label}
                </option>
              ))}
            </select>
          </label>
          <label className={`chip${filters.contract ? ' is-on' : ''}`}>
            <span className="sr-only">Contrat</span>
            <select name="contrat" defaultValue={filters.contract ?? ''}>
              <option value="">Tous contrats</option>
              <option value="apprentissage">Apprentissage</option>
              <option value="professionnalisation">Contrat pro</option>
            </select>
          </label>
          <label className="chip chip--check">
            <input type="checkbox" name="grandes" value="1" defaultChecked={filters.bigCompany} />
            <span>Grandes entreprises</span>
          </label>
          {result.mode !== 'direct' && (
            <label className="chip chip--check">
              <input type="checkbox" name="direct" value="1" defaultChecked={filters.direct} />
              <span>Direct entreprise</span>
            </label>
          )}
        </div>
      </form>
      <AutoSubmit formId="osearch" />

      <ForYou />

      {(filters.page ?? 1) <= 1 && <CampaignStrip />}

      <section className="results" aria-labelledby="offers-list-title">
        <div className="offers__bar">
          <h2 id="offers-list-title">Les plus récentes</h2>
          <span className="num">
            {from}–{to} sur {result.total.toLocaleString('fr-FR')}
          </span>
          <Link href={`/offres/swipe${pageHref(filters, 1).replace('/offres', '')}`} className="offers__swipe">
            Mode swipe
          </Link>
          <Link href="/decoder" className="link">
            Coller une offre
          </Link>
        </div>

        {rows.length === 0 ? (
          <p className="empty">Aucune offre ne correspond. Retire un filtre ou élargis le département.</p>
        ) : (
          <ul className="orows" role="list">
            {rows.map(({ offer, h }) => (
              <OfferRow key={offer.id} offer={offer} h={h} />
            ))}
          </ul>
        )}

        {rows.some(({ offer }) => offer.source === 'adzuna' || offer.source === 'jooble') && (
          <p className="offers__via">
            Une partie des offres via{' '}
            <a href="https://www.adzuna.fr" target="_blank" rel="noopener noreferrer" className="link">
              Adzuna
            </a>{' '}
            et{' '}
            <a href="https://fr.jooble.org" target="_blank" rel="noopener noreferrer" className="link">
              Jooble
            </a>
            , qui regroupent des annonces publiées sur d’autres sites.
          </p>
        )}

        {pages > 1 && (
          <nav className="pager" aria-label="Pages">
            {result.page > 1 ? (
              <Link className="ui-btn" href={pageHref(filters, result.page - 1)}>
                Précédentes
              </Link>
            ) : (
              <span />
            )}
            <span className="num">
              Page {result.page} sur {pages}
            </span>
            {result.page < pages ? (
              <Link className="ui-btn" href={pageHref(filters, result.page + 1)}>
                Suivantes
              </Link>
            ) : (
              <span />
            )}
          </nav>
        )}
      </section>
    </div>
  );
}
