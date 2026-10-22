'use client';

import { useEffect, useRef, useState } from 'react';
import { replaceApplications, useTracker } from '@/components/useTracker';
import { saveProfile, useProfile } from '@/components/useProfile';
import type { PublicAccount } from '@/lib/account/http';
import { sanitizeProfile } from '@/lib/profile';
import { sanitizeApplications, TRACKER_KEY } from '@/lib/tracker';

const SIGNED_IN = 'decode_connecte=1';
/** Envoyé par l'écran du compte juste après la connexion. */
export const SIGNED_IN_EVENT = 'decode:connecte';

function signedIn(): boolean {
  return typeof document !== 'undefined' && document.cookie.split('; ').includes(SIGNED_IN);
}

/**
 * Au retour d'un compte : le profil du compte remplace le profil par défaut de l'appareil,
 * et les deux suivis sont réunis (sans doublon).
 */
export function pullAccount(account: PublicAccount) {
  const remoteProfile = account.profile ? sanitizeProfile(account.profile) : null;
  if (remoteProfile?.filled) saveProfile(remoteProfile);
  const remote = sanitizeApplications(account.tracker ?? []);
  if (remote.length > 0) {
    let local: unknown = [];
    try {
      local = JSON.parse(window.localStorage.getItem(TRACKER_KEY) ?? '[]');
    } catch {
      local = [];
    }
    const mine = sanitizeApplications(local);
    const ids = new Set(mine.map((a) => a.id));
    replaceApplications([...mine, ...remote.filter((a) => !ids.has(a.id))]);
  }
}

/** Connecté : chaque changement du profil ou du suivi est recopié sur le compte, une seconde et demie après. */
export function AccountSync() {
  const [profile] = useProfile();
  const { apps } = useTracker();
  // On n'envoie rien tant que le compte n'a pas été relu : sinon l'appareil écraserait le compte.
  const [pulled, setPulled] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    const load = () => {
      if (!signedIn()) return setPulled(false);
      fetch('/api/compte')
        .then((r) => (r.ok ? r.json() : null))
        .then((d: { account?: PublicAccount } | null) => {
          if (d?.account) pullAccount(d.account);
          setPulled(Boolean(d?.account));
        })
        .catch(() => {});
    };
    load();
    window.addEventListener(SIGNED_IN_EVENT, load);
    return () => window.removeEventListener(SIGNED_IN_EVENT, load);
  }, []);

  useEffect(() => {
    if (!pulled || !signedIn()) return;
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      fetch('/api/compte', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile.filled ? { profile, tracker: apps } : { tracker: apps }),
      }).catch(() => {});
    }, 1500);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [pulled, profile, apps]);

  return null;
}
