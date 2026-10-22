import type { Metadata } from 'next';
import { ProView } from '@/components/pro/ProView';

export const metadata: Metadata = {
  title: 'Décode Pro',
  description: 'Alertes toutes les heures, alertes SMS et prépa entretien. Un mois offert, sans carte. La version gratuite reste complète.',
};

export default async function ProPage({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  return (
    <div className="screen c-screen">
      <div className="c-main">
        <ProView justPaid={(await searchParams).ok === '1'} />
      </div>
    </div>
  );
}
