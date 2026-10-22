import type { Metadata } from 'next';
import { ModerationView } from '@/components/community/ModerationView';

export const metadata: Metadata = { title: 'Modération', robots: { index: false } };

export default function ModerationPage() {
  return <ModerationView />;
}
