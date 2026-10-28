'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { buildTaste, type TasteItem } from '@/lib/taste';

// Les likes et les offres passées, gardés dans le navigateur comme le suivi.
const KEY = 'decode-likes-v1';
const MAX_PASSES = 120;
const MAX_DECODED = 150;

interface Store {
  likes: TasteItem[];
  passes: TasteItem[];
  /** Les offres décodées, la plus récente en premier. */
  decoded: TasteItem[];
}

const EMPTY: Store = { likes: [], passes: [], decoded: [] };
const listeners = new Set<() => void>();
let cached: { raw: string | null; store: Store } = { raw: null, store: EMPTY };
let memory: string | null = null;

function read(): Store {
  let raw = memory;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    // Stockage bloqué : les likes vivent le temps de la page.
  }
  if (raw !== cached.raw) {
    let store = EMPTY;
    try {
      const parsed = raw ? (JSON.parse(raw) as Partial<Store>) : {};
      store = {
        likes: Array.isArray(parsed.likes) ? parsed.likes : [],
        passes: Array.isArray(parsed.passes) ? parsed.passes : [],
        decoded: Array.isArray(parsed.decoded) ? parsed.decoded : [],
      };
    } catch {
      store = EMPTY;
    }
    cached = { raw, store };
  }
  return cached.store;
}

function write(store: Store) {
  const raw = JSON.stringify(store);
  memory = raw;
  try {
    window.localStorage.setItem(KEY, raw);
  } catch {
    cached = { raw, store };
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => e.key === KEY && listener();
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

/** Les likes du compte, réunis avec ceux de l'appareil (sans doublon). */
export function mergeLikes(remote: unknown) {
  const r = remote && typeof remote === 'object' ? (remote as Partial<Store>) : {};
  const s = read();
  const ids = new Set(s.likes.map((l) => l.id));
  const passIds = new Set(s.passes.map((p) => p.id));
  const likes = [...s.likes, ...(Array.isArray(r.likes) ? r.likes : []).filter((l) => l && typeof l.id === 'string' && !ids.has(l.id))];
  const passes = [...s.passes, ...(Array.isArray(r.passes) ? r.passes : []).filter((p) => p && typeof p.id === 'string' && !passIds.has(p.id))].slice(0, MAX_PASSES);
  const seenIds = new Set(s.decoded.map((d) => d.id));
  const decoded = [...s.decoded, ...(Array.isArray(r.decoded) ? r.decoded : []).filter((d) => d && typeof d.id === 'string' && !seenIds.has(d.id))]
    .sort((a, b) => (b.at ?? '').localeCompare(a.at ?? ''))
    .slice(0, MAX_DECODED);
  write({ likes, passes, decoded });
}

/** Garde une offre décodée : elle affine les suggestions et les alertes e-mail. */
export function recordDecoded(item: Omit<TasteItem, 'at'>) {
  const s = read();
  if (s.decoded[0]?.id === item.id) return;
  write({ ...s, decoded: [{ ...item, at: new Date().toISOString() }, ...s.decoded.filter((d) => d.id !== item.id)].slice(0, MAX_DECODED) });
}

/** Les likes et offres passées, tels qu'on les recopie sur le compte. */
export function useLikesStore(): Store {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function useLikes() {
  const store = useSyncExternalStore(subscribe, read, () => EMPTY);
  const isLiked = useCallback((id: string) => store.likes.some((l) => l.id === id), [store]);
  const like = useCallback((item: Omit<TasteItem, 'at'>) => {
    const s = read();
    if (s.likes.some((l) => l.id === item.id)) return;
    write({ ...s, likes: [{ ...item, at: new Date().toISOString() }, ...s.likes], passes: s.passes.filter((p) => p.id !== item.id) });
  }, []);
  const unlike = useCallback((id: string) => {
    const s = read();
    write({ ...s, likes: s.likes.filter((l) => l.id !== id) });
  }, []);
  const pass = useCallback((item: Omit<TasteItem, 'at'>) => {
    const s = read();
    if (s.passes.some((p) => p.id === item.id) || s.likes.some((l) => l.id === item.id)) return;
    write({ ...s, passes: [{ ...item, at: new Date().toISOString() }, ...s.passes].slice(0, MAX_PASSES) });
  }, []);
  /** Annule un « je passe » (le retour arrière du swipe). */
  const unpass = useCallback((id: string) => {
    const s = read();
    write({ ...s, passes: s.passes.filter((p) => p.id !== id) });
  }, []);
  const taste = useMemo(() => buildTaste(store.likes, store.passes, store.decoded), [store]);
  return { likes: store.likes, decoded: store.decoded, isLiked, like, unlike, pass, unpass, taste };
}
