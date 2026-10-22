import type { Metadata } from 'next';
import { DecoderView } from '@/components/offer/DecoderView';
import { isDecodeConfigured } from '@/lib/decode/claude';
import { DEMO_OFFERS } from '@/lib/offers/demo';

export const metadata: Metadata = {
  title: 'Décoder une offre d’alternance',
  description: 'Colle une offre d’alternance : missions en clair, semaine type, pièges, salaire comparé à ton minimum et questions à poser.',
};

export default function DecoderPage() {
  const examples = DEMO_OFFERS.filter((o) => !o.id.endsWith('-relais')).map((o) => ({ id: o.id, title: o.title, company: o.company ?? '' }));
  return <DecoderView aiEnabled={isDecodeConfigured()} examples={examples} />;
}
