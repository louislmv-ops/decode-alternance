import { runAlerts } from '@/lib/account/run-alerts';

// La tournée du matin, lancée par le cron Vercel (vercel.json). Le secret CRON_SECRET est attendu en Bearer.
export const maxDuration = 300;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ error: 'Non autorisé' }, { status: 401 });
  }
  const result = await runAlerts();
  if (!result) return Response.json({ error: 'Comptes non configurés' }, { status: 503 });
  return Response.json(result);
}
