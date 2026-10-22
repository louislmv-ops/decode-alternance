import { reportReview } from '@/lib/companies/store';
import { closed, isCommunityOpen, viewer } from '@/lib/community/http';
import { allow } from '@/lib/rate-limit';

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isCommunityOpen()) return closed();
  const { account } = await viewer();
  if (!account) return Response.json({ error: 'Connecte-toi pour signaler.' }, { status: 401 });
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return Response.json({ error: 'Avis introuvable.' }, { status: 404 });
  if (!allow(`signal-avis:${account.id}:${id}`, 1, 30 * 86_400_000)) return Response.json({ ok: true });
  await reportReview(id);
  return Response.json({ ok: true });
}
