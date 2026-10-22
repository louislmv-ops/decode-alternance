import { z } from 'zod/v4';
import { closed, isCommunityOpen, viewer } from '@/lib/community/http';
import { setFollow } from '@/lib/community/store';
import { allow } from '@/lib/rate-limit';

export async function POST(request: Request, { params }: { params: Promise<{ handle: string }> }) {
  if (!isCommunityOpen()) return closed();
  const { member } = await viewer();
  if (!member) return Response.json({ error: 'Crée ton profil pour suivre quelqu’un.' }, { status: 401 });
  const parsed = z.object({ on: z.boolean() }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'Requête invalide.' }, { status: 400 });
  if (!allow(`suivre:${member.accountId}`, 60, 3_600_000)) return Response.json({ error: 'Doucement.' }, { status: 429 });
  await setFollow(member.accountId, (await params).handle, parsed.data.on);
  return Response.json({ ok: true });
}
