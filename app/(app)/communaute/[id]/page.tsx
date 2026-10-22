import type { Metadata } from 'next';
import { ThreadView } from '@/components/community/ThreadView';

export const metadata: Metadata = { title: 'La commu' };

export default async function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  return <ThreadView id={(await params).id} />;
}
