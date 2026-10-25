'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { buildTaste, type TasteItem } from '@/lib/taste';

// Les likes et les offres passées, gardés dans le navigateur comme le suivi.
const KEY = 'decode-likes-v1';
const MAX_PASSES = 120;

interface Store {
  likes: TasteItem[];
  passes: TasteItem[];
}

const EMPTY: Store = { likes: [], passes: [] };
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
      store = { likes: Array.isArray(parsed.likes) ? parsed.likes : [], passes: Array.isArray(parsed.passes) ? parsed.passes : [] };
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

export function useLikes() {
  const store = useSyncExternalStore(subscribe, read, () => EMPTY);
  const isLiked = useCallback((id: string) => store.likes.some((l) => l.id === id), [store]);
  const like = useCallback((item: Omit<TasteItem, 'at'>) => {
    const s = read();
    if (s.likes.some((l) => l.id === item.id)) return;
    write({ likes: [{ ...item, at: new Date().toISOString() }, ...s.likes], passes: s.passes.filter((p) => p.id !== item.id) });
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
  const taste = useMemo(() => buildTaste(store.likes, store.passes), [store]);
  return { likes: store.likes, isLiked, like, unlike, pass, taste };
}
