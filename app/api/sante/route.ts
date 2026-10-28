import { db, isDatabaseConfigured } from '@/lib/offers/store';

/**
 * L'état du serveur : sa région et le temps d'un aller-retour vers la base. Sert à placer les fonctions
 * au plus près de la base (chaque requête de page en fait plusieurs). Aucune donnée ni configuration exposée.
 */
export async function GET(request: Request) {
  void request;
  const region = process.env.VERCEL_REGION ?? null;
  if (!isDatabaseConfigured()) return Response.json({ region, db: null }, { headers: { 'Cache-Control': 'no-store' } });
  const times: number[] = [];
  try {
    for (let i = 0; i < 3; i++) {
      const t = performance.now();
      await db()`select 1`;
      times.push(Math.round(performance.now() - t));
    }
  } catch {
    return Response.json({ region, db: 'injoignable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
  // La première mesure compte l'ouverture de la connexion ; les suivantes, un simple aller-retour.
  return Response.json({ region, db: { firstMs: times[0], roundTripMs: Math.min(...times.slice(1)) } }, { headers: { 'Cache-Control': 'no-store' } });
}
