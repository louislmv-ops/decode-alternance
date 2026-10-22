import Link from 'next/link';
import { cookies } from 'next/headers';
import { OfferCard } from '@/components/offer/OfferCard';
import { Faq } from '@/components/site/Faq';
import { Fragment } from '@/components/site/Fragments';
import { HeroFragment } from '@/components/site/HeroFragment';
import { SiteFooter } from '@/components/site/SiteFooter';
import { SiteNav } from '@/components/site/SiteNav';
import { DEPARTMENT_OPTIONS } from '@/lib/departments';
import { highlights } from '@/lib/offers/highlights';
import { listOffers } from '@/lib/offers/repository';
import type { OfferPage } from '@/lib/offers/types';
import { decodePayCookie, PROFILE_COOKIE } from '@/lib/profile';

const DOMAINS = ['Marketing', 'Commerce', 'Développeur', 'Ressources humaines', 'Comptabilité', 'Communication', 'Logistique', 'Banque'];

const TOOLS = [
  {
    id: 'missions' as const,
    title: 'Ce que tu feras, vraiment',
    text: 'Colle une offre : le jargon devient une semaine type, et chaque info dit si elle est écrite, déduite ou inconnue.',
    href: '/decoder',
    action: 'Décoder une offre',
    field: 'var(--mint)',
  },
  {
    id: 'salaire' as const,
    title: 'Ton salaire minimum, au centime',
    text: 'Calculé selon ton âge, ton année et ton contrat. Une offre en dessous est signalée.',
    href: '/salaire',
    action: 'Calculer mon salaire',
    field: 'var(--sky)',
  },
  {
    id: 'equipe' as const,
    title: 'À qui écrire dans l’équipe',
    text: 'Le service à viser, les postes à chercher sur LinkedIn et un premier message court.',
    href: '/equipe',
    action: 'Trouver l’équipe',
    field: 'var(--peach)',
  },
];

async function latestOffers(): Promise<OfferPage | null> {
  try {
    return await listOffers({});
  } catch (error) {
    // L'accueil reste lisible si la source des offres ne répond pas.
    console.error(error);
    return null;
  }
}

export default async function Home() {
  const [page, jar] = await Promise.all([latestOffers(), cookies()]);
  const profile = decodePayCookie(jar.get(PROFILE_COOKIE)?.value);
  const latest = (page?.offers ?? []).slice(0, 6).map((offer) => ({ offer, h: highlights(offer, profile) }));

  return (
    <>
      <SiteNav />
      <main className="home">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero__inner">
            <div className="hero__copy">
              <h1 id="hero-title" className="hero__title">
                L’alternance, en clair.
              </h1>
              <p className="hero__lead">Les offres traduites : ce que tu feras, ton salaire minimum et à qui écrire.</p>

              <form className="search" action="/offres" method="get" role="search">
                <label className="search__field search__field--q">
                  <span className="sr-only">Métier, entreprise ou ville</span>
                  <input type="search" name="q" placeholder="Métier, entreprise, ville" autoComplete="off" />
                </label>
                <label className="search__field search__field--dep">
                  <span className="sr-only">Département</span>
                  <select name="dep" defaultValue="">
                    <option value="">Toute la France</option>
                    {DEPARTMENT_OPTIONS.map((d) => (
                      <option key={d.code} value={d.code}>
                        {d.code} · {d.name}
                      </option>
                    ))}
                  </select>
                </label>
                <button type="submit" className="btn search__go">
                  Rechercher
                </button>
              </form>

              <ul className="domains" role="list" aria-label="Recherches par domaine">
                {DOMAINS.map((d) => (
                  <li key={d}>
                    <Link href={`/offres?q=${encodeURIComponent(d)}`} className="domain">
                      {d}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="hero__stage hero__stage--in">
              <HeroFragment />
            </div>
          </div>
        </section>

        <section className="latest band" aria-labelledby="latest-title">
          <div className="band__head" data-reveal>
            <h2 id="latest-title" className="section-title">
              Les dernières offres
            </h2>
            <Link href="/offres" className="link link--always band__more">
              Toutes les offres
            </Link>
          </div>
          {page?.mode === 'exemples' && <p className="latest__note">Exemples fictifs, en attendant que les vraies offres soient branchées.</p>}
          {latest.length > 0 ? (
            <ul className="offer-cards offer-cards--grid" role="list">
              {latest.map(({ offer, h }, i) => (
                <OfferCard key={offer.id} offer={offer} h={h} reveal={i % 2} />
              ))}
            </ul>
          ) : (
            <p className="latest__note">
              Les offres ne répondent pas pour l’instant. <Link href="/offres">Réessaie sur la page Offres</Link>.
            </p>
          )}
        </section>

        <section className="tools band" aria-labelledby="tools-title">
          <h2 id="tools-title" className="section-title" data-reveal>
            Trois outils, zéro blabla
          </h2>
          <div className="tools__list">
            {TOOLS.map((t, i) => (
              <article key={t.id} className={`tool${i % 2 ? ' tool--flip' : ''}`} style={{ background: t.field }} data-reveal>
                <div className="tool__copy">
                  <h3 className="tool__title">{t.title}</h3>
                  <p className="tool__text">{t.text}</p>
                  <Link href={t.href} className="btn btn--small">
                    {t.action}
                  </Link>
                </div>
                <div className="tool__frag">
                  <Fragment id={t.id} />
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="free band" aria-labelledby="free-title">
          <div className="free__box" data-reveal>
            <h2 id="free-title" className="section-title">
              Gratuit pendant la bêta.
            </h2>
            <p className="free__text">
              Ensuite, l’essentiel reste gratuit. Un Pass Saison à 9,99 € pour 3 mois, sans renouvellement, ajoutera les alertes et la
              comparaison d’offres.
            </p>
            <Link href="/offres" className="btn btn--light">
              Voir les offres
            </Link>
          </div>
        </section>

        <Faq />
      </main>
      <SiteFooter />
    </>
  );
}
