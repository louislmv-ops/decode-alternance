import type { Metadata } from 'next';
import { SalaryView } from '@/components/tools/SalaryView';

export const metadata: Metadata = { title: 'Mon salaire minimum' };

export default function SalaryPage() {
  return <SalaryView />;
}
