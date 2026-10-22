import Link from 'next/link';
import { cookies } from 'next/headers';
import { OfferRow } from '@/components/offer/OfferRow';
import { Faq } from '@/components/site/Faq';
import { MatchButton } from '@/components/Matcher';
import { SiteFooter } from '@/components/site/SiteFooter';
import { SiteNav } from '@/components/site/SiteNav';
import { DEPARTMENT_OPTIONS } from '@/lib/departments';
import { DOMAINS } from '@/lib/domains';
import { highlights } from '@/lib/offers/highlights';
import { listOffers } from '@/lib/offers/repository';
import type { OfferPage } from '@/lib/offers/types';
import { decodePayCookie, PROFILE_COOKIE } from '@/lib/profile';

/** Trois étapes, pas une de plus : c'est tout le site. */
const STEPS = [
  { title: 'Cherche', text: 'Les offres de partout, sans les fausses offres d’écoles.', href: '/offres', action: 'Voir les offres' },
  { title: 'Comprends', text: 'Chaque offre traduite : ce que tu feras, combien tu toucheras.', href: '/decoder', action: 'Décoder une offre' },
  { title: 'Démarque-toi', text: 'Qui contacter dans l’équipe, et le suivi de tes candidatures.', href: '/equipe', action: 'Trouver l’équipe' },
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
  const latest = (page?.offers ?? []).slice(0, 5).map((offer) => ({ offer, h: highlights(offer, profile) }));

  return (
    <>
      <SiteNav />
      <main className="home">
        <section className="hero2" aria-labelledby="hero-title">
          <h1 id="hero-title" className="hero2__title">
            Trouve ton alternance. En clair.
          </h1>
          <p className="hero2__lead">Les offres traduites, ton salaire calculé, les pièges écartés. Gratuit.</p>

          <form className="hero2__search" action="/offres" method="get" role="search">
            <label className="hero2__field">
              <span className="hero2__label">Métier</span>
              <input type="search" name="q" placeholder="Marketing, boulanger, développeur…" autoComplete="off" />
            </label>
            <label className="hero2__field">
              <span className="hero2__label">Où</span>
              <select name="dep" defaultValue="">
                <option value="">Toute la France</option>
                {DEPARTMENT_OPTIONS.map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.code} · {d.name}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className="hero2__go">
              C’est parti
            </button>
          </form>

          <p className="hero2__alt">
            Pas d’idée ? <MatchButton className="hero2__match">Ton CV ou 4 questions</MatchButton>
          </p>

          <ul className="hero2__domains" role="list" aria-label="Recherches par domaine">
            {DOMAINS.slice(0, 6).map((d) => (
              <li key={d.label}>
                <Link href={`/offres?q=${encodeURIComponent(d.query)}`}>{d.label}</Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="steps" aria-labelledby="steps-title">
          <h2 id="steps-title" className="sr-only">
            Comment ça marche
          </h2>
          <ol className="steps__list">
            {STEPS.map((step, i) => (
              <li key={step.title} className="step" data-reveal>
                <span className="step__num num">{i + 1}</span>
                <h3 className="step__title">{step.title}</h3>
                <p className="step__text">{step.text}</p>
                <Link href={step.href} className="link step__link">
                  {step.action}
                </Link>
              </li>
            ))}
          </ol>
        </section>

        <section className="home-latest" aria-labelledby="latest-title">
          <div className="offers__bar">
            <h2 id="latest-title">Les dernières offres</h2>
            {page?.mode === 'exemples' && <span className="num">exemples fictifs</span>}
            <Link href="/offres" className="link">
              Toutes les offres
            </Link>
          </div>
          {latest.length > 0 ? (
            <ul className="orows" role="list">
              {latest.map(({ offer, h }) => (
                <OfferRow key={offer.id} offer={offer} h={h} />
              ))}
            </ul>
          ) : (
            <p className="latest__note">
              Les offres ne répondent pas pour l’instant. <Link href="/offres">Réessaie sur la page Offres</Link>.
            </p>
          )}
        </section>

        <Faq mode={page?.mode ?? 'exemples'} />
      </main>
      <SiteFooter />
    </>
  );
}
