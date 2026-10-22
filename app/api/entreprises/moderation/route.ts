import { z } from 'zod/v4';
import { moderateReview, pendingReviews } from '@/lib/companies/store';
import { closed, isAdmin, isCommunityOpen, viewer } from '@/lib/community/http';

async function guard() {
  if (!isCommunityOpen()) return closed();
  const { account } = await viewer();
  return isAdmin(account) ? null : Response.json({ error: 'Réservé à la modération.' }, { status: 403 });
}

export async function GET() {
  const denied = await guard();
  if (denied) return denied;
  return Response.json({ pending: await pendingReviews() });
}

export async function POST(request: Request) {
  const denied = await guard();
  if (denied) return denied;
  const parsed = z.object({ id: z.string().uuid(), publish: z.boolean() }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'Requête invalide.' }, { status: 400 });
  await moderateReview(parsed.data.id, parsed.data.publish);
  return Response.json({ ok: true });
}
