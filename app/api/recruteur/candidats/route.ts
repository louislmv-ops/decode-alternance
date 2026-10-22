import { closed, isCommunityOpen, viewer } from '@/lib/community/http';
import { recruiterByAccount, searchCandidates } from '@/lib/recruiters/store';

export async function GET(request: Request) {
  if (!isCommunityOpen()) return closed();
  const { account } = await viewer();
  const recruiter = account ? await recruiterByAccount(account.id) : null;
  if (!recruiter?.verified) return Response.json({ error: 'Réservé aux entreprises vérifiées.' }, { status: 403 });
  const url = new URL(request.url);
  const level = Number(url.searchParams.get('niveau'));
  const candidates = await searchCandidates({
    domain: url.searchParams.get('domaine')?.slice(0, 40) || undefined,
    department: url.searchParams.get('ville')?.slice(0, 40) || undefined,
    level: level >= 3 && level <= 7 ? level : undefined,
    startBefore: /^\d{4}-\d{2}$/.test(url.searchParams.get('debut') ?? '') ? url.searchParams.get('debut')! : undefined,
  });
  return Response.json({ candidates });
}
