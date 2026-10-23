// De la position du navigateur au département, par l'API Géo de l'État (gratuite, sans clé).
// La position, arrondie au kilomètre, n'est ni gardée ni journalisée.

import { DEPARTMENT_NAMES } from '@/lib/departments';

const geo = () => process.env.GEO_API_URL || 'https://geo.api.gouv.fr';

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const lat = Number(params.get('lat'));
  const lon = Number(params.get('lon'));
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return Response.json({ error: 'Position invalide.' }, { status: 400 });
  }
  const url = `${geo()}/communes?${new URLSearchParams({ lat: lat.toFixed(2), lon: lon.toFixed(2), fields: 'nom,codeDepartement', format: 'json' })}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    const [commune] = res.ok ? ((await res.json()) as { nom?: string; codeDepartement?: string }[]) : [];
    if (!commune?.codeDepartement || !DEPARTMENT_NAMES[commune.codeDepartement]) {
      return Response.json({ error: 'On ne trouve pas de département français à cette position.' }, { status: 404 });
    }
    return Response.json({ department: commune.codeDepartement, city: commune.nom ?? '' }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return Response.json({ error: 'Service de localisation indisponible. Choisis ton département à la main.' }, { status: 502 });
  }
}
