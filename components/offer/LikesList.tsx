'use client';

import Link from 'next/link';
import { Mascotte } from '@/components/Mascotte';
import { useLikes } from '@/components/useLikes';
import { LikeButton } from './LikeButton';
import { AccountNudge } from '@/components/account/AccountNudge';

/** Les offres likées puis les dernières décodées. Gardées dans ce navigateur et sur le compte. */
export function LikesList() {
  const { likes, decoded, isLiked } = useLikes();
  const recent = decoded.filter((d) => !isLiked(d.id)).slice(0, 20);
  return (
    <div className="screen">
      <div className="title-row">
        <div>
          <h1>Mes likes</h1>
          <p className="title-row__sub">
            {likes.length > 0 ? `${likes.length} offre${likes.length > 1 ? 's' : ''} gardée${likes.length > 1 ? 's' : ''}.` : 'Like une offre avec le cœur pour la retrouver ici.'}
          </p>
        </div>
      </div>
      <AccountNudge what="tes likes et tes offres décodées" />
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
      {recent.length > 0 && (
        <>
          <h2 className="likes-list__h">Décodées récemment</h2>
          <ul className="likes-list" role="list">
            {recent.map((l) => (
              <li key={l.id} className="likes-list__item">
                <Link href={l.href} className="likes-list__link">
                  <span className="foryou-likes__company">{l.company ?? 'Entreprise non nommée'}</span>
                  <span className="foryou-likes__title">{l.title}</span>
                </Link>
                <LikeButton item={l} />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
