import type { Metadata } from 'next';
import { SalaryView } from '@/components/tools/SalaryView';

export const metadata: Metadata = {
  title: 'Salaire minimum en alternance',
  description: 'Ton salaire minimum d’apprenti ou en contrat pro, au centime, selon ton âge et ton année, et ce que tu coûtes vraiment à une entreprise, aides comprises.',
};

export default function SalaryPage() {
  return <SalaryView />;
}
