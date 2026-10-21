import { departmentsForSlot, runIngest, SLOTS } from '@/lib/offers/ingest';
import { isDatabaseConfigured } from '@/lib/offers/store';

// Collecte d'une tranche de départements par appel, pour un cron externe ou un plan Vercel Pro
// (la collecte quotidienne passe par GitHub Actions). Le secret CRON_SECRET est attendu en Bearer.
export const maxDuration = 300;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ error: 'Non autorisé' }, { status: 401 });
  }
  if (!isDatabaseConfigured()) {
    return Response.json({ error: 'DATABASE_URL manquant' }, { status: 503 });
  }

  const slot = Math.floor(new Date().getUTCHours() / 2) % SLOTS;
  const lines: string[] = [];
  const report = await runIngest({
    departments: departmentsForSlot(slot),
    // Les sites carrière une fois par jour, dans le premier créneau.
    careerSites: slot === 0,
    log: (line) => lines.push(line),
  });
  return Response.json({ slot, report, log: lines });
}
