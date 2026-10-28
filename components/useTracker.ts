'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { sanitizeApplications, TRACKER_KEY, type Application } from '@/lib/tracker';

const listeners = new Set<() => void>();
const EMPTY: Application[] = [];
let cached: { raw: string | null; apps: Application[] } = { raw: null, apps: EMPTY };
let memory: string | null = null;

function read(): Application[] {
  let raw: string | null = memory;
  try {
    raw = window.localStorage.getItem(TRACKER_KEY);
  } catch {
    // Stockage bloqué : le suivi vit le temps de la page.
  }
  if (raw !== cached.raw) {
    let parsed: unknown = [];
    try {
      parsed = raw ? JSON.parse(raw) : [];
    } catch {
      parsed = [];
    }
    cached = { raw, apps: sanitizeApplications(parsed) };
  }
  return cached.apps;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => e.key === TRACKER_KEY && listener();
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

function write(apps: Application[]) {
  const raw = JSON.stringify(apps);
  memory = raw;
  try {
    window.localStorage.setItem(TRACKER_KEY, raw);
  } catch {
    cached = { raw, apps };
  }
  listeners.forEach((l) => l());
}

/** Remplace tout le suivi, par exemple par celui retrouvé sur le compte. */
export function replaceApplications(apps: Application[]) {
  write(sanitizeApplications(apps));
}

export function useTracker() {
  const apps = useSyncExternalStore(subscribe, read, () => EMPTY);
  const add = useCallback((app: Omit<Application, 'id'>) => {
    const id = crypto.randomUUID();
    write([{ ...app, id }, ...read()]);
    return id;
  }, []);
  const update = useCallback((id: string, patch: Partial<Application>) => write(read().map((a) => (a.id === id ? { ...a, ...patch } : a))), []);
  const remove = useCallback((id: string) => write(read().filter((a) => a.id !== id)), []);
  return { apps, add, update, remove };
}
