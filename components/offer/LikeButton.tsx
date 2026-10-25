'use client';

import { useState } from 'react';
import { useLikes } from '@/components/useLikes';
import type { TasteItem } from '@/lib/taste';

/** Le cœur : enregistre l'offre et apprend ce que la personne aime. */
export function LikeButton({ item, className = '' }: { item: Omit<TasteItem, 'at'>; className?: string }) {
  const { isLiked, like, unlike } = useLikes();
  const [pop, setPop] = useState(0);
  const liked = isLiked(item.id);
  return (
    <button
      type="button"
      className={`like${liked ? ' is-liked' : ''} ${className}`}
      aria-pressed={liked}
      aria-label={liked ? `Retirer « ${item.title} » de tes likes` : `Liker « ${item.title} »`}
      onClick={() => {
        if (liked) unlike(item.id);
        else {
          like(item);
          setPop((n) => n + 1);
        }
      }}
    >
      <svg key={pop} className={pop ? 'like__heart is-pop' : 'like__heart'} width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 20.5s-7.5-4.6-9.3-9.3C1.4 7.8 3.6 4.5 7 4.5c2 0 3.4 1.1 5 3 1.6-1.9 3-3 5-3 3.4 0 5.6 3.3 4.3 6.7-1.8 4.7-9.3 9.3-9.3 9.3z" />
      </svg>
    </button>
  );
}
