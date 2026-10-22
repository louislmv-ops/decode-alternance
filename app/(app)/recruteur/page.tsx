import type { Metadata } from 'next';
import { connection } from 'next/server';
import { RecruiterApp } from '@/components/recruiters/RecruiterApp';
import { isCommunityOpen } from '@/lib/community/http';

export const metadata: Metadata = { title: 'Espace entreprise', robots: { index: false } };

export default async function RecruiterPage() {
  await connection();
  return (
    <div className="screen c-screen">
      <div className="c-main">
        <h1 className="c-charte__title">Espace entreprise</h1>
        <RecruiterApp open={isCommunityOpen()} />
      </div>
    </div>
  );
}
