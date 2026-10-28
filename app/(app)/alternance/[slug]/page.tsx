import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { JsonLd } from '@/components/JsonLd';
import { OfferRow } from '@/components/offer/OfferRow';
import { communityPayFor } from '@/lib/companies/store';
import { DOMAINS } from '@/lib/domains';
import { formatEuros } from '@/lib/format';
import {
  CITIES,
  type City,
  domainWord,
  findLanding,
  type Landing,
  landingFilters,
  landingHref,
  landingTitle,
  placeText,
} from '@/lib/landing';
import { filtersQuery } from '@/lib/offers/filter';
import { highlights } from '@/lib/offers/highlights';
import { listOffers } from '@/lib/offers/repository';
import type { OfferPage } from '@/lib/offers/types';
import { decodePayCookie } from '@/lib/profile';
import { SMIC } from '@/lib/rules/reference';
import { minimumSalary } from '@/lib/rules/salary';
import { breadcrumbJsonLd, faqJsonLd, itemListJsonLd } from '@/lib/seo';

// Refaite au plus toutes les heures, puis servie depuis le cache : aucune requête aux sources entre deux.
export const revalidate = 3600;

// Aucune page construite d'avance (la collecte n'est pas joignable pendant le build) : chacune l'est à sa première visite.
export function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ slug: string }> };

/** En dessous, la page serait trop maigre pour Google : elle reste visible, mais pas indexée. */
const MIN_INDEXED = 3;

async function load(slug: string): Promise<{ landing: Landing; page: OfferPage | null } | null> {
  const landing = findLanding(slug);
  if (!landing) return null;
  const page = await listOffers(landingFilters(landing)).catch((error) => {
    console.error(error);
    return null;
  });
  return { landing, page };
}

function describe(landing: Landing): string {
  const what = landing.domain ? ` en ${domainWord(landing.domain)}` : '';
  return `Les offres d’alternance${what} ${placeText(landing.city)}, triées des plus attirantes aux moins attirantes, avec ton salaire minimum et sans les fausses offres d’écoles.`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await load((await params).slug);
  if (!data) return { title: 'Page introuvable', robots: { index: false } };
  const { landing, page } = data;
  const title = landingTitle(landing);
  const thin = !page || page.mode === 'exemples' || page.total < MIN_INDEXED;
  return {
    title: thin ? title : `${title} : ${page.total.toLocaleString('fr-FR')} offres`,
    description: describe(landing),
    alternates: { canonical: landingHref(landing.domain, landing.city) },
    robots: thin ? { index: false, follow: true } : undefined,
    openGraph: { title, description: describe(landing), url: landingHref(landing.domain, landing.city) },
  };
}

/** « 1er juin 2026 », « 27 octobre 2026 », à l'heure de Paris. */
function longDate(date: Date): string {
  const text = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Paris' });
  return text.replace(/^1 /, '1er ');
}

/** Le minimum légal, le même partout en France : quatre cas courants. */
function salaryRows() {
  const row = (label: string, contract: 'apprentissage' | 'professionnalisation', age: number, year: number) => ({
    label,
    ...minimumSalary({ contract, age, year, hasBacPro: false }),
  });
  return [
    row('Apprentissage, 18 à 20 ans, 1re année', 'apprentissage', 19, 1),
    row('Apprentissage, 21 à 25 ans, 1re année', 'apprentissage', 22, 1),
    row('Apprentissage, 21 à 25 ans, 3e année', 'apprentissage', 22, 3),
    row('Contrat pro, 21 à 25 ans', 'professionnalisation', 22, 1),
  ];
}

function related(landing: Landing): { title: string; links: { href: string; label: string }[] }[] {
  const { domain, city } = landing;
  const groups: { title: string; links: { href: string; label: string }[] }[] = [];
  if (domain) {
    groups.push({
      title: city ? `${domain.label}, ailleurs` : `${domain.label}, par ville`,
      links: CITIES.filter((c) => c.slug !== city?.slug)
        .slice(0, 12)
        .map((c) => ({ href: landingHref(domain, c), label: c.name })),
    });
  }
  groups.push({
    title: city ? `À ${city.name}, d’autres métiers` : 'D’autres métiers',
    links: DOMAINS.filter((d) => d !== domain).map((d) => ({ href: landingHref(d, city), label: d.label })),
  });
  if (!domain && city) {
    groups.push({
      title: 'D’autres villes',
      links: CITIES.filter((c) => c.slug !== city.slug)
        .slice(0, 12)
        .map((c: City) => ({ href: landingHref(null, c), label: c.name })),
    });
  }
  return groups;
}

export default async function LandingPage({ params }: Props) {
  const data = await load((await params).slug);
  if (!data) notFound();
  const { landing, page } = data;
  const { domain, city } = landing;
  const title = landingTitle(landing);

  // Pas de cookie ici : la page est la même pour tout le monde, donc mise en cache. Le profil par défaut fixe le minimum.
  const profile = decodePayCookie(undefined);
  const offers = (page?.offers ?? []).slice(0, 12);
  const community = await communityPayFor(offers);
  const rows = offers.map((offer) => ({ offer, h: highlights(offer, profile, community.get(offer.id)) }));
  const total = page?.total ?? 0;
  const demo = page?.mode === 'exemples';
  const what = domain ? ` en ${domainWord(domain)}` : '';
  const where = placeText(city);
  const salaries = salaryRows();
  const [young, older] = salaries;
  const updated = longDate(new Date());
  const searchHref = `/offres?${filtersQuery(landingFilters(landing))}`;

  const faq = [
    {
      q: `Combien gagne un alternant${what} ${where} ?`,
      a: `Au minimum ${formatEuros(young!.cents)} brut par mois entre 18 et 20 ans en 1re année d’apprentissage, et ${formatEuros(older!.cents)} entre 21 et 25 ans. C’est le minimum légal, le même partout en France ; une entreprise peut payer plus, et dès 21 ans la convention collective peut l’imposer.`,
    },
    {
      q: `Comment trouver une alternance${what} ${where} ?`,
      a: 'Vise d’abord les offres publiées directement par les entreprises, écris au service qui recrute et pas seulement aux RH, et relance au bout d’une semaine. Décode traduit chaque offre en clair et te dit qui contacter dans l’équipe.',
    },
    {
      q: 'Les offres sont-elles fiables ?',
      a: 'Décode écarte les fausses offres d’écoles (des formations présentées comme des offres d’emploi) et renvoie toujours vers l’annonce d’origine. Décode ne garantit ni contrat, ni entretien, ni réponse.',
    },
  ];

  const crumbs = [
    { name: 'Accueil', path: '/' },
    { name: 'Alternance', path: '/alternance' },
    ...(domain ? [{ name: domain.label, path: landingHref(domain, null) }] : []),
    ...(city ? [{ name: city.name, path: landingHref(domain, city) }] : []),
  ];

  return (
    <div className="screen land">
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <JsonLd data={faqJsonLd(faq)} />
      {!demo && rows.length > 0 && (
        <JsonLd data={itemListJsonLd(title, rows.map(({ offer }) => `/offres/${encodeURIComponent(offer.id)}`))} />
      )}

      <nav className="land__crumbs" aria-label="Fil d’Ariane">
        <ol>
          {crumbs.map((c, i) => (
            <li key={c.path}>
              {i === crumbs.length - 1 ? <span aria-current="page">{c.name}</span> : <Link href={c.path}>{c.name}</Link>}
            </li>
          ))}
        </ol>
      </nav>

      <header className="offers__head land__head">
        <h1>{title}</h1>
        <p className="land__lead">
          {demo ? (
            <>Exemples fictifs pour l’instant : les vraies offres arrivent dès que les sources sont branchées.</>
          ) : (
            <>
              <strong className="num">{total.toLocaleString('fr-FR')}</strong> offre{total > 1 ? 's' : ''} d’alternance{what} {where}, sans les fausses offres
              d’écoles. Mis à jour le {updated}.
            </>
          )}
        </p>
      </header>

      <section className="results" aria-labelledby="land-offers">
        <div className="offers__bar">
          <h2 id="land-offers">Les plus attirantes</h2>
          <Link href={searchHref} className="link">
            Toutes, avec les filtres
          </Link>
        </div>
        {rows.length > 0 ? (
          <ul className="orows" role="list">
            {rows.map(({ offer, h }) => (
              <OfferRow key={offer.id} offer={offer} h={h} />
            ))}
          </ul>
        ) : (
          <p className="land__empty">
            Aucune offre en ce moment. <Link href={searchHref}>Élargis la recherche</Link>.
          </p>
        )}
        <p className="land__more">
          <Link href={searchHref} className="ui-btn ui-btn--primary">
            Voir toutes les offres
          </Link>
        </p>
      </section>

      <section className="land__block" aria-labelledby="land-pay">
        <h2 id="land-pay">Ton salaire minimum</h2>
        <table className="table land__table">
          <tbody>
            {salaries.map((s) => (
              <tr key={s.label}>
                <th scope="row">{s.label}</th>
                <td className="num">{formatEuros(s.cents)}</td>
                <td className="num land__rate">{s.rate} % du SMIC</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="land__source">
          Brut mensuel, SMIC du {longDate(new Date(SMIC.since))}, articles D6222-26 et
          D6325-15 du Code du travail. <Link href="/salaire" className="link link--always">Calcule le tien</Link>
        </p>
      </section>

      <section className="land__block" aria-labelledby="land-faq">
        <h2 id="land-faq">En bref</h2>
        <dl className="land__faq">
          {faq.map((f) => (
            <div key={f.q}>
              <dt>{f.q}</dt>
              <dd>{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      {related(landing).map((group) => (
        <nav key={group.title} className="land__block" aria-label={group.title}>
          <h2>{group.title}</h2>
          <ul className="land__links" role="list">
            {group.links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="chip">
                  <span>{l.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ))}
    </div>
  );
}
