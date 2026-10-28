import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { OfferRow } from '@/components/offer/OfferRow';
import { Faq } from '@/components/site/Faq';
import { SwipePromo } from '@/components/offer/SwipePromo';
import { Mascotte, type MascottePose } from '@/components/Mascotte';
import { Planet } from '@/components/home/Planet';
import { MatchButton } from '@/components/MatchButton';
import { SiteFooter } from '@/components/site/SiteFooter';
import { SiteNav } from '@/components/site/SiteNav';
import { DEPARTMENT_NAMES, DEPARTMENT_OPTIONS } from '@/lib/departments';
import { LocationPrompt } from '@/components/offer/LocationPrompt';
import { filtersWithPlace } from '@/lib/offers/filter';
import { PLACE_COOKIE } from '@/lib/place';
import { DOMAINS } from '@/lib/domains';
import { highlights } from '@/lib/offers/highlights';
import { communityPayFor } from '@/lib/companies/store';
import { listOffers } from '@/lib/offers/repository';
import type { OfferPage } from '@/lib/offers/types';
import { decodePayCookie, PROFILE_COOKIE } from '@/lib/profile';

/** Trois étapes, pas une de plus : c'est tout le site. */
const STEPS: { title: string; text: string; href: string; action: string; pose: MascottePose }[] = [
  { pose: 'lunettes', title: 'Cherche', text: 'Les offres de partout, sans les fausses offres d’écoles.', href: '/offres', action: 'Voir les offres' },
  { pose: 'loupe', title: 'Comprends', text: 'Chaque offre traduite : ce que tu feras, combien tu toucheras.', href: '/decoder', action: 'Décoder une offre' },
  { pose: 'diplome', title: 'Démarque-toi', text: 'Qui contacter dans l’équipe, et le suivi de tes candidatures.', href: '/equipe', action: 'Trouver l’équipe' },
];

async function latestOffers(departments: string[]): Promise<OfferPage | null> {
  try {
    return await listOffers({ departments });
  } catch (error) {
    // L'accueil reste lisible si la source des offres ne répond pas.
    console.error(error);
    return null;
  }
}

export const metadata: Metadata = { alternates: { canonical: '/' } };

/** Décode s'assoit sur un mot du titre : il se pose en douceur, puis respire et cligne de l'œil. */
function Peek({ where }: { where: 'd' | 'm' }) {
  return (
    <span className={`hero2__peek hero2__peek--${where}`} aria-hidden="true">
      <span className="hero2__peek-in">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/decode/assis-320.webp" alt="" width={320} height={268} fetchPriority="high" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="hero2__peek-wink" src="/decode/assis-clin-320.webp" alt="" width={320} height={268} loading="lazy" />
      </span>
    </span>
  );
}

export default async function Home() {
  const jar = await cookies();
  const placeCookie = jar.get(PLACE_COOKIE)?.value;
  const departments = filtersWithPlace({}, placeCookie).departments ?? [];
  const page = await latestOffers(departments);
  const profile = decodePayCookie(jar.get(PROFILE_COOKIE)?.value);
  const offers = (page?.offers ?? []).slice(0, 5);
  const community = await communityPayFor(offers);
  const latest = offers.map((offer) => ({ offer, h: highlights(offer, profile, community.get(offer.id)) }));

  return (
    <>
      <SiteNav />
      <main className="home">
        <section className="hero2" aria-labelledby="hero-title">
          {/* Le ciel : des étoiles, la planète de Décode en image fixe, puis en mouvement quand elle est prête. */}
          <div className="sky" aria-hidden="true">
            <div className="sky__stars" />
            <div className="sky__poster" />
            <Planet />
          </div>
          <div className="hero2__content">
            <h1 id="hero-title" className="hero2__title">
              <span className="hero2__w" style={{ '--i': 0 } as React.CSSProperties}>
                Trouve
              </span>{' '}
              <span className="hero2__w hero2__ton" style={{ '--i': 1 } as React.CSSProperties}>
                {/* Sur téléphone, le titre passe sur trois lignes : Décode s'accroche à la première, au-dessus de « ton ». */}
                <Peek where="m" />
                ton
              </span>{' '}
              <span className="hero2__w hero2__hang" style={{ '--i': 2 } as React.CSSProperties}>
                <Peek where="d" />
                alternance.
              </span>
              <br />
              <span className="hero2__w hero2__mark" style={{ '--i': 3 } as React.CSSProperties}>
                En clair.
              </span>
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
          </div>
        </section>

        <div className="home__swipe">
          <SwipePromo />
        </div>

        {!placeCookie && <LocationPrompt />}

        <section className="home-latest" aria-labelledby="latest-title">
          <div className="offers__bar">
            <h2 id="latest-title">
              {departments.length === 1 ? `Les meilleures offres, ${DEPARTMENT_NAMES[departments[0]!]}` : 'Les meilleures offres du moment'}
            </h2>
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

        <section className="steps" aria-labelledby="steps-title">
          <h2 id="steps-title" className="sr-only">
            Comment ça marche
          </h2>
          <ol className="steps__list">
            {STEPS.map((step, i) => (
              <li key={step.title} className="step" data-reveal style={{ '--i': i } as React.CSSProperties}>
                <span className="step__badge">
                  <Mascotte pose={step.pose} size="100%" className="step__mascotte" />
                  <span className="step__num num">{i + 1}</span>
                </span>
                <h3 className="step__title">{step.title}</h3>
                <p className="step__text">{step.text}</p>
                <Link href={step.href} className="link step__link">
                  {step.action}
                </Link>
              </li>
            ))}
          </ol>
        </section>

        <Faq mode={page?.mode ?? 'exemples'} />
      </main>
      <SiteFooter />
    </>
  );
}
