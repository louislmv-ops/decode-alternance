import type { Metadata } from 'next';
import { connection } from 'next/server';
import { CommunityApp } from '@/components/community/CommunityApp';
import { isCommunityOpen } from '@/lib/community/http';

export const metadata: Metadata = {
  title: 'La commu des alternants',
  description: 'Questions, témoignages et astuces entre alternants. Suis ceux qui font le même métier ou vivent dans ta ville.',
  alternates: { canonical: '/communaute' },
};

export default async function CommunityPage() {
  await connection();
  return <CommunityApp open={isCommunityOpen()} />;
}
