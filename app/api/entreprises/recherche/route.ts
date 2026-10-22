import { searchCompanies } from '@/lib/companies/search';
import { allow, clientKey } from '@/lib/rate-limit';

export async function GET(request: Request) {
  if (!allow(`entreprises:${clientKey(request)}`, 60, 60_000)) return Response.json({ error: 'Trop de recherches. Attends une minute.' }, { status: 429 });
  const q = new URL(request.url).searchParams.get('q') ?? '';
  try {
    return Response.json({ results: await searchCompanies(q) });
  } catch {
    return Response.json({ error: 'L’annuaire des entreprises ne répond pas.' }, { status: 503 });
  }
}
