'use client';

import Link from 'next/link';
import { useLikes } from '@/components/useLikes';
import { scoreOffer, type TasteItem } from '@/lib/taste';
import { LikeButton } from './LikeButton';

/**
 * En haut des offres : celles de la page qui ressemblent le plus à ce que la personne a liké,
 * avec la raison. Rien tant qu'il n'y a pas de like : on n'invente pas des goûts.
 */
export function ForYouLikes({ candidates }: { candidates: Omit<TasteItem, 'at'>[] }) {
  const { likes, taste, isLiked } = useLikes();
  if (likes.length === 0) return null;
  const picks = candidates
    .filter((c) => !isLiked(c.id))
    .map((c) => ({ c, m: scoreOffer(c, taste) }))
    // Le niveau ou la taille d'entreprise seuls ne suffisent pas : il faut une vraie ressemblance (métier, secteur, coin).
    .filter(({ m }) => m.score >= 1.5)
    .sort((a, b) => b.m.score - a.m.score)
    .slice(0, 3);

  return (
    <section className="foryou-likes" aria-labelledby="foryou-likes-title">
      <div className="foryou-likes__head">
        <h2 id="foryou-likes-title">Pour toi, d’après tes likes</h2>
        <Link href="/likes" className="link">
          Mes likes ({likes.length})
        </Link>
      </div>
      {picks.length > 0 ? (
        <ul className="foryou-likes__list" role="list">
          {picks.map(({ c, m }) => (
            <li key={c.id} className="foryou-likes__item">
              <Link href={c.href} className="foryou-likes__link">
                <span className="foryou-likes__company">{c.company ?? 'Entreprise non nommée'}</span>
                <span className="foryou-likes__title">{c.title}</span>
                {m.reason && <span className="foryou-likes__why">{m.reason}</span>}
              </Link>
              <LikeButton item={c} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="foryou-likes__empty">Rien sur cette page ne ressemble encore à tes likes. Continue de liker : Décode apprend.</p>
      )}
    </section>
  );
}
