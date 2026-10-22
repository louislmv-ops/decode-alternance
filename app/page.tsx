import Link from 'next/link';
import { cookies } from 'next/headers';
import { OfferCard } from '@/components/offer/OfferCard';
import { Faq } from '@/components/site/Faq';
import { Fragment } from '@/components/site/Fragments';
import { MatchButton } from '@/components/Matcher';
import { HeroDecode } from '@/components/site/HeroDecode';
import { SiteFooter } from '@/components/site/SiteFooter';
import { SiteNav } from '@/components/site/SiteNav';
import { DEPARTMENT_OPTIONS } from '@/lib/departments';
import { DOMAINS } from '@/lib/domains';
import { highlights } from '@/lib/offers/highlights';
import { listOffers } from '@/lib/offers/repository';
import type { OfferPage } from '@/lib/offers/types';
import { decodePayCookie, PROFILE_COOKIE } from '@/lib/profile';

const PROMISES = [
  'Missions en clair',
  'Salaire minimum calculé pour toi',
  'Offres d’écoles virées',
  'Qui contacter sur LinkedIn',
];

const TOOLS = [
  {
    id: 'missions' as const,
    title: 'Ce que tu feras, vraiment',
    text: 'Le jargon devient une semaine type.',
    href: '/decoder',
    action: 'Décoder une offre',
    field: 'var(--mint)',
  },
  {
    id: 'salaire' as const,
    title: 'Combien tu touches, au centime',
    text: 'Selon ton âge et ton année. Les offres en dessous sont signalées.',
    href: '/salaire',
    action: 'Calculer mon salaire',
    field: 'var(--sky)',
  },
  {
    id: 'equipe' as const,
    title: 'Qui contacter pour passer devant',
    text: 'Le bon service, les bonnes recherches LinkedIn, un message court.',
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
                L’alternance, sans le blabla.
              </h1>
              <p className="hero__lead">Chaque offre traduite. Missions, salaire, qui contacter.</p>

              <div className="hero__cta">
                <MatchButton className="btn btn--accent btn--big">Mes offres</MatchButton>
                <p className="hero__cta-sub">Ton CV ou 4 questions. Gratuit.</p>
              </div>

              <form className="search" action="/offres" method="get" role="search">
                <label className="search__field search__field--q">
                  <span className="sr-only">Métier, entreprise ou ville</span>
                  <input type="search" name="q" placeholder="Ou cherche : métier, entreprise" autoComplete="off" />
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
                  Chercher
                </button>
              </form>

              <ul className="domains" role="list" aria-label="Recherches par domaine">
                {DOMAINS.slice(0, 8).map((d) => (
                  <li key={d.label}>
                    <Link href={`/offres?q=${encodeURIComponent(d.query)}`} className="domain">
                      {d.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="hero__stage hero__stage--in">
              <HeroDecode />
            </div>
          </div>
        </section>

        <div className="ticker" aria-label="Ce que fait Décode">
          <ul className="ticker__track" role="list">
            {PROMISES.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>

        <section className="latest band" aria-labelledby="latest-title">
          <div className="band__head" data-reveal>
            <h2 id="latest-title" className="section-title">
              Les dernières offres
            </h2>
            <Link href="/offres" className="link link--always band__more">
              Toutes les offres
            </Link>
          </div>
          {page?.mode === 'exemples' && <p className="latest__note">Exemples fictifs pour l’instant.</p>}
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
            Ce que les autres ne font pas
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
              Gratuit. Sans compte.
            </h2>
            <p className="free__text">
              Offres, décodage et alertes compris. Ton profil reste à toi.
            </p>
            <Link href="/offres" className="btn btn--light">
              Voir les offres
            </Link>
          </div>
        </section>

        <Faq mode={page?.mode ?? 'exemples'} />
      </main>
      <SiteFooter />
    </>
  );
}
