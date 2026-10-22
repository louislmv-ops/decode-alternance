import { z } from 'zod/v4';
import { closed, isCommunityOpen, viewer } from '@/lib/community/http';
import { reportPost } from '@/lib/community/store';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isCommunityOpen()) return closed();
  const { member } = await viewer();
  if (!member) return Response.json({ error: 'Connecte-toi pour signaler.' }, { status: 401 });
  const parsed = z.object({ reason: z.string().trim().max(200).default('') }).safeParse(await request.json().catch(() => ({})));
  const id = (await params).id;
  if (!parsed.success || !/^[0-9a-f-]{36}$/.test(id)) return Response.json({ error: 'Requête invalide.' }, { status: 400 });
  await reportPost(id, member.accountId, parsed.data.reason);
  return Response.json({ ok: true });
}
