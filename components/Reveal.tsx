'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

/** Fait apparaître une fois les éléments `data-reveal` qui entrent à l'écran, à chaque changement de page. */
export function Reveal() {
  const pathname = usePathname();

  useEffect(() => {
    const targets = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]:not(.is-in)'));
    if (targets.length === 0) return;
    if (!('IntersectionObserver' in window)) {
      targets.forEach((el) => el.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.08 },
    );
    targets.forEach((el) => io.observe(el));
    // Filet de sécurité : rien ne doit rester caché si l'observateur ne s'est pas déclenché.
    const timer = window.setTimeout(() => {
      targets.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('is-in');
      });
    }, 2500);
    return () => {
      io.disconnect();
      window.clearTimeout(timer);
    };
  }, [pathname]);

  return null;
}
