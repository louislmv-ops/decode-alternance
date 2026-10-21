import type { Metadata } from 'next';
import { TrackerView } from '@/components/tools/TrackerView';

export const metadata: Metadata = { title: 'Mon suivi' };

export default function TrackerPage() {
  return <TrackerView />;
}
