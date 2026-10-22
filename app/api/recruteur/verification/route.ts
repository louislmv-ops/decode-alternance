import { z } from 'zod/v4';
import { closed, isAdmin, isCommunityOpen, viewer } from '@/lib/community/http';
import { pendingRecruiters, setRecruiterVerified } from '@/lib/recruiters/store';

async function guard() {
  if (!isCommunityOpen()) return closed();
  const { account } = await viewer();
  return isAdmin(account) ? null : Response.json({ error: 'Réservé à la modération.' }, { status: 403 });
}

export async function GET() {
  const denied = await guard();
  if (denied) return denied;
  return Response.json({ pending: await pendingRecruiters() });
}

export async function POST(request: Request) {
  const denied = await guard();
  if (denied) return denied;
  const parsed = z.object({ accountId: z.string().uuid(), verified: z.boolean() }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'Requête invalide.' }, { status: 400 });
  await setRecruiterVerified(parsed.data.accountId, parsed.data.verified);
  return Response.json({ ok: true });
}
