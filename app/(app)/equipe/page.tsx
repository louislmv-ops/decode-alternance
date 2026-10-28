import type { Metadata } from 'next';
import { TeamView } from '@/components/tools/TeamView';

export const metadata: Metadata = {
  title: 'Trouver l’équipe sur LinkedIn',
  description: 'Le service à viser, les bonnes recherches LinkedIn et un premier message court pour contacter l’équipe qui recrute ton alternant.',
  alternates: { canonical: '/equipe' },
};

export default async function TeamPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const one = (k: string) => {
    const v = params[k];
    return ((Array.isArray(v) ? v[0] : v) ?? '').slice(0, 80);
  };
  return <TeamView initial={{ company: one('entreprise'), service: one('service'), city: one('ville') }} />;
}
