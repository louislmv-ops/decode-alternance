import type { Metadata } from 'next';
import { SponsorDashboard } from '@/components/sponsors/SponsorDashboard';

export const metadata: Metadata = { title: 'Tableau de bord entreprise', robots: { index: false } };

export default async function SponsorDashboardPage({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  return (
    <div className="screen c-screen">
      <div className="c-main">
        <SponsorDashboard justPaid={(await searchParams).ok === '1'} />
      </div>
    </div>
  );
}
