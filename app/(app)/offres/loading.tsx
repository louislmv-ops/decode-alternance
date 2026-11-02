import { Waiting } from '@/components/states/Waiting';

export default function Loading() {
  return (
    <div className="screen">
      <Waiting title="Décode cherche les offres…" sub="Toutes les sources d’un coup : quelques secondes." />
    </div>
  );
}
