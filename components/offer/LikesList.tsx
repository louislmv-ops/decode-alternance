'use client';

import Link from 'next/link';
import { Mascotte } from '@/components/Mascotte';
import { useLikes } from '@/components/useLikes';
import { LikeButton } from './LikeButton';

/** Les offres likées, de la plus récente à la plus ancienne. Gardées dans ce navigateur. */
export function LikesList() {
  const { likes } = useLikes();
  return (
    <div className="screen">
      <div className="title-row">
        <div>
          <h1>Mes likes</h1>
          <p className="title-row__sub">
            {likes.length > 0 ? `${likes.length} offre${likes.length > 1 ? 's' : ''} gardée${likes.length > 1 ? 's' : ''}. Plus tu likes, plus Décode te propose des offres qui te ressemblent.` : 'Like une offre avec le cœur pour la retrouver ici.'}
          </p>
        </div>
      </div>
      {likes.length === 0 ? (
        <div className="empty">
          <Mascotte pose="pense" size={128} className="empty__mascotte" />
          <p>
            Pas encore de like. <Link href="/offres">Parcours les offres</Link> ou essaie le <Link href="/offres/swipe">mode swipe</Link>.
          </p>
        </div>
      ) : (
        <ul className="likes-list" role="list">
          {likes.map((l) => (
            <li key={l.id} className="likes-list__item">
              <Link href={l.href} className="likes-list__link">
                <span className="foryou-likes__company">{l.company ?? 'Entreprise non nommée'}</span>
                <span className="foryou-likes__title">{l.title}</span>
                {l.perks.length > 0 && <span className="foryou-likes__why">{l.perks.slice(0, 3).join(' · ')}</span>}
              </Link>
              <LikeButton item={l} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
