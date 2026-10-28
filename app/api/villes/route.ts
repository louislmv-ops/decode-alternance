// Les villes qui commencent par ce qui est tapé (ou ce code postal), pour chercher « autour de ». API Géo de l'État.

import { DEPARTMENT_NAMES } from '@/lib/departments';

const geo = () => process.env.GEO_API_URL || 'https://geo.api.gouv.fr';

interface Commune {
  nom?: string;
  codeDepartement?: string;
  codesPostaux?: string[];
  centre?: { coordinates?: number[] };
}

export async function GET(request: Request) {
  const q = (new URL(request.url).searchParams.get('q') ?? '').trim().slice(0, 60);
  if (q.length < 2) return Response.json({ cities: [] });
  const params = new URLSearchParams({ fields: 'nom,codeDepartement,codesPostaux,centre', boost: 'population', limit: '6', format: 'json' });
  params.set(/^\d{5}$/.test(q) ? 'codePostal' : 'nom', q);
  try {
    const res = await fetch(`${geo()}/communes?${params}`, { signal: AbortSignal.timeout(5000) });
    const list = res.ok ? ((await res.json()) as Commune[]) : [];
    const cities = list.flatMap((c) => {
      const [lon, lat] = c.centre?.coordinates ?? [];
      if (!c.nom || !c.codeDepartement || !DEPARTMENT_NAMES[c.codeDepartement] || typeof lat !== 'number' || typeof lon !== 'number') return [];
      return [{ name: c.nom, department: c.codeDepartement, postalCode: c.codesPostaux?.[0] ?? null, lat, lon }];
    });
    return Response.json({ cities }, { headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' } });
  } catch {
    return Response.json({ cities: [], error: 'Recherche de ville indisponible.' }, { status: 502 });
  }
}
