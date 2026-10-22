import type { Metadata } from 'next';
import { MemberView } from '@/components/community/MemberView';

type Props = { params: Promise<{ handle: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `@${(await params).handle}` };
}

export default async function MemberPage({ params }: Props) {
  return <MemberView handle={(await params).handle} />;
}
