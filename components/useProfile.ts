'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { DEFAULT_PROFILE, encodePayCookie, PROFILE_COOKIE, PROFILE_KEY, sanitizeProfile, type Profile } from '@/lib/profile';

const listeners = new Set<() => void>();
let cached: { raw: string | null; profile: Profile } = { raw: null, profile: DEFAULT_PROFILE };

function read(): Profile {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(PROFILE_KEY);
  } catch {
    // Navigation privée ou stockage bloqué : le profil par défaut suffit.
  }
  if (raw !== cached.raw) {
    let parsed: unknown = null;
    try {
      parsed = raw ? JSON.parse(raw) : null;
    } catch {
      parsed = null;
    }
    cached = { raw, profile: parsed ? sanitizeProfile(parsed) : DEFAULT_PROFILE };
  }
  return cached.profile;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => e.key === PROFILE_KEY && listener();
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

export function saveProfile(profile: Profile) {
  const clean = sanitizeProfile({ ...profile, filled: true });
  try {
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify(clean));
  } catch {
    // Sans stockage, le profil vit le temps de la page.
    cached = { raw: JSON.stringify(clean), profile: clean };
  }
  document.cookie = `${PROFILE_COOKIE}=${encodePayCookie(clean)}; path=/; max-age=31536000; samesite=lax`;
  listeners.forEach((l) => l());
}

/** Le profil du candidat, lu sur l'appareil. Renvoie le profil par défaut côté serveur. */
export function useProfile(): [Profile, (p: Profile) => void] {
  const profile = useSyncExternalStore(subscribe, read, () => DEFAULT_PROFILE);
  const set = useCallback((p: Profile) => saveProfile(p), []);
  return [profile, set];
}
