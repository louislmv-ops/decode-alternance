'use client';

import { useEffect, useRef } from 'react';

function send(id: string, kind: 'impression' | 'click') {
  const body = JSON.stringify({ id, kind });
  // sendBeacon survit au changement de page qui suit un clic.
  if (!navigator.sendBeacon?.(`/api/pro/stat`, new Blob([body], { type: 'application/json' }))) {
    void fetch('/api/pro/stat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
  }
}

/** Compte une vue quand l'offre mise en avant apparaît à l'écran, et un clic quand on l'ouvre. */
export function SponsorBeacon({ id }: { id: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    // L'élément de la liste, ou la carte du swipe.
    const item = ref.current?.closest('li, article');
    if (!item) return;
    let seen = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !seen) {
          seen = true;
          send(id, 'impression');
          observer.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(item);
    const onClick = (e: Event) => {
      if ((e.target as HTMLElement).closest('a')) send(id, 'click');
    };
    item.addEventListener('click', onClick);
    return () => {
      observer.disconnect();
      item.removeEventListener('click', onClick);
    };
  }, [id]);
  return <span ref={ref} hidden />;
}
