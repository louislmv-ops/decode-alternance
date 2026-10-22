import type { Metadata } from 'next';
import Link from 'next/link';
import { connection } from 'next/server';
import { CompanySearch } from '@/components/companies/CompanySearch';
import { Score } from '@/components/companies/Stars';
import { type CompanySummary, topCompanies } from '@/lib/companies/store';
import { isCommunityOpen } from '@/lib/community/http';

export const metadata: Metadata = {
  title: 'Avis et salaires des alternants, par entreprise',
  description: 'Ce que les alternants gagnent vraiment, comparé au minimum légal, et ce qu’ils pensent de leur entreprise : tuteur, missions, rythme école.',
};

export default async function CompaniesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await connection();
  let top: CompanySummary[] = [];
  if (isCommunityOpen()) top = await topCompanies().catch(() => []);
  return (
    <div className="screen c-screen">
      <div className="c-main">
        <h1 className="c-charte__title">Avis et salaires</h1>
        <p className="c-profile__bio">Ce que les alternants gagnent et pensent de leur boîte. Anonyme.</p>
        <CompanySearch initial={((await searchParams).q ?? '').slice(0, 80)} />
        {top.length > 0 && (
          <section className="e-top">
            <h2>Les plus renseignées</h2>
            <ul className="e-results" role="list">
              {top.map((c) => (
                <li key={c.siren}>
                  <Link href={`/entreprises/${c.siren}`}>
                    <strong>{c.name}</strong>
                    <span>
                      {c.reviews} avis · {c.salaries} salaire{c.salaries > 1 ? 's' : ''}
                    </span>
                    <Score value={c.overall} />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
        <p className="c-note">
          Ton alternance, ton salaire : cherche ta boîte et partage. Il faut 3 réponses pour qu’une moyenne s’affiche, jamais un chiffre seul.
        </p>
      </div>
    </div>
  );
}
