'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Wordmark } from '@/components/Wordmark';
import { useProfile } from '@/components/useProfile';
import { daysLeftWithoutEmployer } from '@/lib/profile';
import { IconClose, IconDecode, IconEuro, IconList, IconMenu, IconPeople, IconTrack, IconUser } from './Icons';

const NAV = [
  { href: '/offres', label: 'Offres', icon: IconList },
  { href: '/decoder', label: 'Décoder une offre', icon: IconDecode },
  { href: '/suivi', label: 'Mon suivi', icon: IconTrack },
  { href: '/salaire', label: 'Mon salaire', icon: IconEuro },
  { href: '/equipe', label: 'Trouver l’équipe', icon: IconPeople },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Chrono() {
  const [profile] = useProfile();
  if (!profile.cfaStart) {
    return (
      <Link href="/profil" className="chrono chrono--empty">
        <span className="chrono__label">Chrono des 3 mois</span>
        <span className="chrono__hint">Inscrit en CFA sans entreprise ? Indique ta date de rentrée.</span>
      </Link>
    );
  }
  const left = daysLeftWithoutEmployer(profile.cfaStart);
  return (
    <Link href="/profil" className={`chrono${left <= 21 ? ' chrono--urgent' : ''}`}>
      <span className="chrono__label">Chrono des 3 mois</span>
      <span className="chrono__value num">{left > 0 ? `J-${left}` : 'Délai dépassé'}</span>
      <span className="chrono__hint">
        {left > 0 ? 'pour signer avec une entreprise' : 'Parle à ton CFA de la suite de ta formation.'}
      </span>
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const current = NAV.find((n) => isActive(pathname, n.href))?.label ?? (pathname.startsWith('/profil') ? 'Mon profil' : 'Décode');

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const nav = (
    <>
      <nav aria-label="Appli" className="shell-nav">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className="shell-nav__item" aria-current={isActive(pathname, href) ? 'page' : undefined} onClick={() => setMenuOpen(false)}>
            <Icon />
            {label}
          </Link>
        ))}
      </nav>
      <div className="shell-foot">
        <Chrono />
        <Link href="/profil" className="shell-nav__item" aria-current={pathname.startsWith('/profil') ? 'page' : undefined} onClick={() => setMenuOpen(false)}>
          <IconUser />
          Mon profil
        </Link>
      </div>
    </>
  );

  return (
    <div className="app">
      <aside className="shell" aria-label="Navigation">
        <Link href="/" className="shell__brand" aria-label="Décode, accueil">
          <Wordmark />
        </Link>
        {nav}
      </aside>

      <header className="phone-bar">
        <Link href="/" aria-label="Décode, accueil" className="phone-bar__brand">
          <Wordmark />
        </Link>
        <span className="phone-bar__title">{current}</span>
        <button type="button" className="phone-bar__menu" aria-expanded={menuOpen} aria-controls="phone-sheet" onClick={() => setMenuOpen(true)}>
          <IconMenu />
          <span className="sr-only">Ouvrir le menu</span>
        </button>
      </header>

      {menuOpen && (
        <div id="phone-sheet" className="phone-sheet" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="phone-sheet__head">
            <Wordmark />
            <button type="button" className="phone-bar__menu" onClick={() => setMenuOpen(false)}>
              <IconClose />
              <span className="sr-only">Fermer le menu</span>
            </button>
          </div>
          {nav}
        </div>
      )}

      <main className="canvas">{children}</main>
    </div>
  );
}
