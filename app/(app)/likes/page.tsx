import type { Metadata } from 'next';
import { LikesList } from '@/components/offer/LikesList';

export const metadata: Metadata = { title: 'Mes likes', robots: { index: false } };

export default function LikesPage() {
  return <LikesList />;
}
