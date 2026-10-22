import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { ForYou } from '@/components/offer/ForYou';
import { OfferCard } from '@/components/offer/OfferCard';
import { DEPARTMENT_OPTIONS } from '@/lib/departments';
import { decodePayCookie, PROFILE_COOKIE } from '@/lib/profile';
import { DIPLOMA_LEVELS } from '@/lib/rules/employer';
import { parseFilters } from '@/lib/offers/filter';
import { highlights } from '@/lib/offers/highlights';
import { listOffers } from '@/lib/offers/repository';
import type { OfferFilters } from '@/lib/offers/types';

export const metadata: Metadata = { title: 'Offres d’alternance' };

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
    <div className="screen">
      <div className="title-row">
        <div>
          <h1>Offres d’alternance</h1>
          <p className="title-row__sub">
            {result.total.toLocaleString('fr-FR')} offre{result.total > 1 ? 's' : ''}
            {pepites > 0 ? (
              <>
                {' '}
                · <span className="hl">{pepites} pépite{pepites > 1 ? 's' : ''}</span> sur cette page pour ton profil
              </>
            ) : null}
            {' '}
            · salaires comparés à ton minimum ({profile.age} ans, {profile.year}
            {profile.year === 1 ? 're' : 'e'} année{profile.filled ? '' : ', profil par défaut'})
          </p>
        </div>
        <Link href="/decoder" className="ui-btn ui-btn--primary">
          Coller une offre
        </Link>
      </div>

      {result.mode === 'exemples' && (
        <p className="notice">Exemples fictifs : les vraies offres ne sont pas encore branchées. Tu peux déjà coller n’importe quelle offre.</p>
      )}

      <ForYou />

      <form className="filters" action="/offres" method="get" role="search">
        <label className="filters__search">
          <span className="sr-only">Métier, entreprise ou ville</span>
          <input className="ui-input" type="search" name="q" defaultValue={filters.q} placeholder="Métier, entreprise ou ville" />
        </label>
        <label>
          <span className="sr-only">Département</span>
          <select className="ui-select" name="dep" defaultValue={filters.department ?? ''}>
            <option value="">Toute la France</option>
            {DEPARTMENT_OPTIONS.map((d) => (
              <option key={d.code} value={d.code}>
                {d.code} · {d.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Ton niveau de diplôme</span>
          <select className="ui-select" name="niveau" defaultValue={filters.level ? String(filters.level) : ''}>
            <option value="">Tous niveaux</option>
            {DIPLOMA_LEVELS.map((l) => (
              <option key={l.level} value={l.level}>
                Jusqu’à {l.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Contrat</span>
          <select className="ui-select" name="contrat" defaultValue={filters.contract ?? ''}>
            <option value="">Tous contrats</option>
            <option value="apprentissage">Apprentissage</option>
            <option value="professionnalisation">Contrat pro</option>
          </select>
        </label>
        <label className="ui-check">
          <input type="checkbox" name="grandes" value="1" defaultChecked={filters.bigCompany} />
          Grandes entreprises
        </label>
        {result.mode !== 'direct' && (
          <label className="ui-check">
            <input type="checkbox" name="direct" value="1" defaultChecked={filters.direct} />
            Direct entreprise
          </label>
        )}
        <button type="submit" className="ui-btn ui-btn--primary">
          Rechercher
        </button>
      </form>

      <section className="results" aria-labelledby="offers-list-title">
        <div className="panel__head">
          <h2 id="offers-list-title">Les plus récentes</h2>
          <span className="panel__meta num">
            {from}–{to} sur {result.total.toLocaleString('fr-FR')}
          </span>
        </div>

        {rows.length === 0 ? (
          <p className="empty">Aucune offre ne correspond. Retire un filtre ou élargis le département.</p>
        ) : (
          <ul className="offer-cards" role="list">
            {rows.map(({ offer, h }) => (
              <OfferCard key={offer.id} offer={offer} h={h} />
            ))}
          </ul>
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
