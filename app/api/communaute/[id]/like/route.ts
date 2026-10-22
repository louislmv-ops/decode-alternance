import { z } from 'zod/v4';
import { closed, isCommunityOpen, viewer } from '@/lib/community/http';
import { setLike } from '@/lib/community/store';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isCommunityOpen()) return closed();
  const { member } = await viewer();
  if (!member) return Response.json({ error: 'Crée ton profil pour aimer un message.' }, { status: 401 });
  const parsed = z.object({ on: z.boolean() }).safeParse(await request.json().catch(() => null));
  const id = (await params).id;
  if (!parsed.success || !/^[0-9a-f-]{36}$/.test(id)) return Response.json({ error: 'Requête invalide.' }, { status: 400 });
  await setLike(id, member.accountId, parsed.data.on);
  return Response.json({ ok: true });
}
