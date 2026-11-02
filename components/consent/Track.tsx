'use client';

import { useEffect } from 'react';
import { track, type AnalyticsEvent } from '@/lib/analytics';

/** Envoie un événement à l'affichage d'une page, et à nouveau si ses propriétés changent (nouvelle recherche). */
export function Track({ event, props }: { event: AnalyticsEvent; props: Record<string, string | number | boolean | null | string[]> }) {
  const key = JSON.stringify(props);
  useEffect(() => {
    track(event, JSON.parse(key));
  }, [event, key]);
  return null;
}
