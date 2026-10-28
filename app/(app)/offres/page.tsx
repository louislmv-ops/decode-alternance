import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { SwipePromo } from '@/components/offer/SwipePromo';
import { ForYouLikes } from '@/components/offer/ForYouLikes';
import { extractPerks } from '@/lib/offers/perks';
import { tasteOf } from '@/lib/taste';
import { offerHref } from '@/lib/offers/link';
import { CampaignStrip } from '@/components/campaigns/CampaignStrip';
import { Emoji } from '@/components/Emoji';
import { AutoSubmit } from '@/components/offer/AutoSubmit';
import { ForYou } from '@/components/offer/ForYou';
import { LocationPrompt } from '@/components/offer/LocationPrompt';
import { MoreFilters } from '@/components/offer/MoreFilters';
import { PlacePicker } from '@/components/offer/PlacePicker';
import { SortSelect } from '@/components/offer/SortSelect';
import { OfferRow } from '@/components/offer/OfferRow';
import { decodePayCookie, PROFILE_COOKIE } from '@/lib/profile';
import { DIPLOMA_LEVELS } from '@/lib/rules/employer';
import { filtersQuery, filtersWithPlace, moreFiltersCount } from '@/lib/offers/filter';
import { PLACE_COOKIE } from '@/lib/place';
import { highlights } from '@/lib/offers/highlights';
import { communityPayFor } from '@/lib/companies/store';
import { listOffers } from '@/lib/offers/repository';
import { completeWith } from '@/lib/offers/similar';
import { PAGE_SIZE } from '@/lib/offers/filter';
import type { OfferFilters } from '@/lib/offers/types';
import { Mascotte } from '@/components/Mascotte';

/** Les sources à citer sous la liste, comme leurs conditions le demandent. */
const VIA = [
  { source: 'la-bonne-alternance', label: 'La bonne alternance', href: 'https://labonnealternance.apprentissage.beta.gouv.fr' },
  { source: 'france-travail', label: 'France Travail', href: 'https://www.francetravail.fr' },
  { source: 'adzuna', label: 'Adzuna', href: 'https://www.adzuna.fr' },
  { source: 'jooble', label: 'Jooble', href: 'https://fr.jooble.org' },
] as const;

export const metadata: Metadata = {
  title: 'Offres d’alternance',
  description: 'Les offres d’alternance avec leur paie notée en €, ton salaire minimum comparé et les offres d’écoles écartées.',
  alternates: { canonical: '/offres' },
};

function pageHref(filters: OfferFilters, page: number): string {
  return `/offres?${filtersQuery(filters, page)}`;
}

const SINCE_OPTIONS = [
  { value: '', label: 'Toutes dates' },
  { value: '1', label: 'Dernières 24 h' },
  { value: '7', label: 'Cette semaine' },
  { value: '30', label: 'Ce mois-ci' },
];

export default async function OffersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [params, jar] = await Promise.all([searchParams, cookies()]);
  const placeCookie = jar.get(PLACE_COOKIE)?.value;
  const filters = filtersWithPlace(params, placeCookie);
  const askPlace = !placeCookie && params.dep === undefined && params.autour === undefined;
  const profile = decodePayCookie(jar.get(PROFILE_COOKIE)?.value);
  const more = moreFiltersCount(filters);
  const anyFilter = Boolean(filters.q || filters.level || filters.contract || filters.sinceDays || filters.easyApply || filters.remote || more > 0);
  const result = await listOffers(filters);
  const community = await communityPayFor(result.offers);
  const rows = result.offers.map((offer) => ({ offer, h: highlights(offer, profile, community.get(offer.id)) }));
  const pepites = rows.filter((r) => r.h.pepite).length;
  const from = result.total === 0 ? 0 : (result.page - 1) * result.pageSize + 1;
  const to = Math.min(result.total, result.page * result.pageSize);
  const pages = Math.min(result.maxPage ?? Infinity, Math.max(1, Math.ceil(result.total / result.pageSize)));
  // Moins d'une page de résultats : on complète avec des offres proches, en disant ce qui a été élargi.
  const similar =
    (filters.page ?? 1) <= 1 && result.total < PAGE_SIZE && (anyFilter || Boolean(filters.departments?.length) || Boolean(filters.near))
      ? await completeWith(filters, result.offers, PAGE_SIZE - result.offers.length, listOffers)
      : [];
  const similarCommunity = similar.length ? await communityPayFor(similar.flatMap((g) => g.offers)) : new Map();

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
            <span className="sr-only">Métier, domaine, entreprise ou mot-clé</span>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <circle cx="9" cy="9" r="6" />
              <path d="M13.5 13.5L17 17" strokeLinecap="round" />
            </svg>
            <input type="search" name="q" defaultValue={filters.q} placeholder="Métier, domaine, mot-clé…" />
          </label>
          <button type="submit" className="osearch__go">
            Rechercher
          </button>
        </div>
        <div className="osearch__chips">
          <PlacePicker formId="osearch" selected={filters.departments ?? []} near={filters.near ?? null} />
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
          <label className={`chip${filters.sinceDays ? ' is-on' : ''}`}>
            <span className="sr-only">Date de publication</span>
            <select name="depuis" defaultValue={filters.sinceDays ? String(filters.sinceDays) : ''}>
              {SINCE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="chip chip--check">
            <input type="checkbox" name="teletravail" value={filters.remote === 'total' ? 'total' : '1'} defaultChecked={Boolean(filters.remote)} />
            <span>Télétravail</span>
          </label>
          <label className="chip chip--check">
            <input type="checkbox" name="simple" value="1" defaultChecked={filters.easyApply} />
            <span><Emoji name="eclair" /> Candidature simplifiée</span>
          </label>
          <MoreFilters filters={filters} count={more} />
          {anyFilter && (
            <Link href="/offres" className="chip chip--reset">
              <span>Réinitialiser</span>
            </Link>
          )}
        </div>
      </form>
      <AutoSubmit formId="osearch" />

      {askPlace ? <LocationPrompt /> : <ForYou />}

      <ForYouLikes candidates={rows.map(({ offer }) => tasteOf(offer, offerHref(offer), extractPerks(offer.description)))} />

      <section className="results" aria-labelledby="offers-list-title">
        <div className="offers__bar">
          <h2 id="offers-list-title">Les offres</h2>
          <span className="num">
            {from}–{to} sur {result.total.toLocaleString('fr-FR')}
          </span>
          <SortSelect formId="osearch" value={filters.sort ?? 'top'} />
          <Link href={`/offres/swipe${pageHref(filters, 1).replace('/offres', '')}`} className="offers__swipe">
            Mode swipe
          </Link>
          <Link href="/likes" className="link">
            Mes likes
          </Link>
        </div>

        {result.relaxed && rows.length > 0 && (
          <p className="offers__relaxed">
            Aucune offre n’a tous les mots de « {filters.q} ». Voici celles qui en ont le plus.
          </p>
        )}

        {rows.length === 0 ? (
          <div className="empty">
            <Mascotte pose="surpris" size={128} className="empty__mascotte" />
            <p>
              Aucune offre ne correspond. Retire un filtre ou élargis le lieu. <Link href="/offres">Réinitialiser les filtres</Link>
            </p>
          </div>
        ) : (
          <>
            {/* Les offres d'abord : le swipe et les campagnes viennent après les cinq premières. */}
            <ul className="orows" role="list">
              {rows.slice(0, 5).map(({ offer, h }) => (
                <OfferRow key={offer.id} offer={offer} h={h} />
              ))}
            </ul>
            <SwipePromo href={`/offres/swipe${pageHref(filters, 1).replace('/offres', '')}`} />
            {(filters.page ?? 1) <= 1 && <CampaignStrip />}
            {rows.length > 5 && (
              <ul className="orows" role="list">
                {rows.slice(5).map(({ offer, h }) => (
                  <OfferRow key={offer.id} offer={offer} h={h} />
                ))}
              </ul>
            )}
          </>
        )}

        {similar.length > 0 && (
          <section className="similar" aria-labelledby="similar-title">
            <h2 id="similar-title" className="similar__title">
              {rows.length === 0 ? 'Des offres proches de ta recherche' : 'D’autres offres qui pourraient te plaire'}
            </h2>
            {similar.map((group) => (
              <div key={group.label} className="similar__group">
                <p className="similar__why">{group.label}</p>
                <ul className="orows" role="list">
                  {group.offers.map((offer) => (
                    <OfferRow key={offer.id} offer={offer} h={highlights(offer, profile, similarCommunity.get(offer.id))} />
                  ))}
                </ul>
              </div>
            ))}
          </section>
        )}

        {(() => {
          const via = VIA.filter((v) => rows.some(({ offer }) => offer.source === v.source));
          if (via.length === 0) return null;
          return (
            <p className="offers__via">
              Offres via{' '}
              {via.map((v, i) => (
                <span key={v.source}>
                  {i > 0 && (i === via.length - 1 ? ' et ' : ', ')}
                  <a href={v.href} target="_blank" rel="noopener noreferrer" className="link">
                    {v.label}
                  </a>
                </span>
              ))}
              .
            </p>
          );
        })()}

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
