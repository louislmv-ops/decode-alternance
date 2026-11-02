import { Waiting } from '@/components/states/Waiting';

export default function Loading() {
  return (
    <div className="screen">
      <Waiting title="Décode ouvre l’offre…" />
    </div>
  );
}
