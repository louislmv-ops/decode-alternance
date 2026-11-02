import { Mascotte } from '@/components/Mascotte';

/** Un chargement : Décode et sa loupe, une phrase, une barre qui avance. Annoncé aux lecteurs d'écran. */
export function Waiting({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="decode-wait" role="status">
      <Mascotte pose="loupe" size={72} className="decode-wait__mascotte" eager />
      <div>
        <p className="decode-wait__title">{title}</p>
        {sub && <p className="decode-wait__sub">{sub}</p>}
        <span className="decode-wait__bar" aria-hidden="true" />
      </div>
    </div>
  );
}
