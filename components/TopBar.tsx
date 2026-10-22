'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Wordmark } from '@/components/Wordmark';
import { useProfile } from '@/components/useProfile';
import { daysLeftWithoutEmployer } from '@/lib/profile';
import { IconChat, IconDecode, IconEuro, IconList, IconPeople, IconTrack, IconUser } from '@/components/app/Icons';

export const NAV = [
  { href: '/offres', label: 'Offres', short: 'Offres', icon: IconList, tab: true },
  { href: '/decoder', label: 'Décoder une offre', short: 'Décoder', icon: IconDecode, tab: true },
  { href: '/communaute', label: 'La commu', short: 'Commu', icon: IconChat, tab: true },
  { href: '/suivi', label: 'Mon suivi', short: 'Suivi', icon: IconTrack, tab: true },
  { href: '/salaire', label: 'Mon salaire', short: 'Salaire', icon: IconEuro, tab: true },
  // Trouver l'équipe se fait surtout depuis une offre : sur téléphone, il passe par la fiche.
  { href: '/equipe', label: 'Trouver l’équipe', short: 'Équipe', icon: IconPeople, tab: false },
];

export function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Le chrono des 3 mois, en pastille : visible seulement quand la date de rentrée est connue. */
function Chrono() {
  const [profile] = useProfile();
  if (!profile.cfaStart) return null;
  const left = daysLeftWithoutEmployer(profile.cfaStart);
  return (
    <Link
      href="/profil"
      className={`chrono-pill num${left <= 21 ? ' is-urgent' : ''}`}
      title="Jours restants pour signer avec une entreprise après ta rentrée en CFA"
    >
      {left > 0 ? `J-${left}` : 'Délai dépassé'}
    </Link>
  );
}

/** La barre du haut, la même sur l'accueil et dans l'appli. */
export function TopBar() {
  const pathname = usePathname();
  return (
    <header className="topbar">
      <div className="topbar__inner">
        <Link href="/" className="topbar__brand" aria-label="Décode, accueil">
          <Wordmark />
        </Link>
        <nav aria-label="Principale" className="topbar__nav">
          {NAV.map(({ href, short }) => (
            <Link key={href} href={href} className="topbar__link" aria-current={isActive(pathname, href) ? 'page' : undefined}>
              {short}
            </Link>
          ))}
        </nav>
        <div className="topbar__end">
          <Chrono />
          <Link
            href="/compte"
            className="topbar__profile"
            aria-current={pathname.startsWith('/compte') || pathname.startsWith('/profil') ? 'page' : undefined}
          >
            <IconUser />
            <span className="topbar__profile-label">Mon compte</span>
          </Link>
          {pathname === '/' && (
            <Link href="/decoder" className="btn btn--small topbar__action">
              Décoder une offre
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

/** Sur téléphone, les cinq outils restent sous le pouce. */
export function TabBar() {
  const pathname = usePathname();
  return (
    <nav aria-label="Outils" className="tabbar">
      {NAV.filter((n) => n.tab).map(({ href, short, icon: Icon }) => (
        <Link key={href} href={href} className="tabbar__item" aria-current={isActive(pathname, href) ? 'page' : undefined}>
          <Icon />
          <span>{short}</span>
        </Link>
      ))}
    </nav>
  );
}
