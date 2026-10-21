import Link from 'next/link';
import { Board } from '@/components/site/Board';
import { Faq } from '@/components/site/Faq';
import { HeroFragment } from '@/components/site/HeroFragment';
import { Pricing } from '@/components/site/Pricing';
import { Showcase } from '@/components/site/Showcase';
import { SiteFooter } from '@/components/site/SiteFooter';
import { SiteNav } from '@/components/site/SiteNav';

export default function Home() {
  return (
    <>
      <SiteNav />
      <main className="site">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero__copy">
            <h1 id="hero-title" className="hero__title">
              L’alternance,
              <br /> en clair.
            </h1>
            <p className="hero__lead">
              Colle une offre. On te dit ce que tu feras, ton salaire minimum et à qui écrire.
            </p>
            <div className="hero__actions">
              <Link href="/decoder" className="btn">
                Décoder une offre
              </Link>
              <Link href="/offres" className="link link--always">
                Voir les offres
              </Link>
            </div>
          </div>
          <div className="hero__stage-wrap shutter shutter--load">
            <div className="hero__stage stroke shutter__inner">
              <HeroFragment />
            </div>
          </div>
        </section>

        <Showcase />
        <svg className="band" viewBox="0 0 1000 40" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          <polygon points="20,0 1000,0 980,40 0,40" />
        </svg>
        <Board />
        <Pricing />
        <Faq />
      </main>
      <SiteFooter />
    </>
  );
}
