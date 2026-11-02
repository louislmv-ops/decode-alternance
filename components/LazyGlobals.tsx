'use client';

import dynamic from 'next/dynamic';
import { isAnalyticsConfigured } from '@/lib/consent';

// Le questionnaire et l'assistant servent sur toutes les pages mais rarement : ils arrivent après
// l'affichage, dans leur propre fichier, au lieu d'alourdir le premier chargement.
const Matcher = dynamic(() => import('./Matcher').then((m) => m.Matcher), { ssr: false });
const Assistant = dynamic(() => import('./Assistant').then((m) => m.Assistant), { ssr: false });
const Analytics = dynamic(() => import('./consent/Analytics').then((m) => m.Analytics), { ssr: false });
const CookieBanner = dynamic(() => import('./consent/CookieBanner').then((m) => m.CookieBanner), { ssr: false });

export function LazyGlobals({ chat }: { chat: boolean }) {
  return (
    <>
      <Matcher />
      {chat && <Assistant />}
      {isAnalyticsConfigured() && (
        <>
          <CookieBanner />
          <Analytics />
        </>
      )}
    </>
  );
}
