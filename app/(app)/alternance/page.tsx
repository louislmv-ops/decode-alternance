import type { Metadata } from 'next';
import Link from 'next/link';
import { JsonLd } from '@/components/JsonLd';
import { DOMAINS } from '@/lib/domains';
import { CITIES, landingHref } from '@/lib/landing';
import { breadcrumbJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Alternance par métier et par ville',
  description: 'Toutes les offres d’alternance rangées par métier et par ville : marketing, commerce, data, développeur, RH, à Paris, Lyon, Bordeaux, Lille et ailleurs.',
  alternates: { canonical: '/alternance' },
};

export default function LandingHub() {
  return (
    <div className="screen land">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Accueil', path: '/' },
          { name: 'Alternance', path: '/alternance' },
        ])}
      />
      <header className="offers__head land__head">
        <h1>L’alternance, par métier et par ville</h1>
      </header>

      <nav className="land__block" aria-labelledby="hub-domains">
        <h2 id="hub-domains">Par métier</h2>
        <ul className="land__links" role="list">
          {DOMAINS.map((d) => (
            <li key={d.label}>
              <Link href={landingHref(d, null)} className="chip">
                <span>{d.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <nav className="land__block" aria-labelledby="hub-cities">
        <h2 id="hub-cities">Par ville</h2>
        <ul className="land__links" role="list">
          {CITIES.map((c) => (
            <li key={c.slug}>
              <Link href={landingHref(null, c)} className="chip">
                <span>{c.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {DOMAINS.map((d) => (
        <nav key={d.label} className="land__block" aria-label={`${d.label} par ville`}>
          <h2>{d.label}</h2>
          <ul className="land__links land__links--plain" role="list">
            {CITIES.map((c) => (
              <li key={c.slug}>
                <Link href={landingHref(d, c)} className="link">
                  {d.label} à {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ))}
    </div>
  );
}
