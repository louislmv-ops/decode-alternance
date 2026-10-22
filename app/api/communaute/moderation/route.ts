import { z } from 'zod/v4';
import { closed, isAdmin, isCommunityOpen, viewer } from '@/lib/community/http';
import { banMember, moderate, reportedPosts } from '@/lib/community/store';

const Action = z.union([
  z.object({ postId: z.string().uuid(), action: z.enum(['garder', 'masquer']) }),
  z.object({ ban: z.string().min(3).max(20) }),
]);

async function guard() {
  if (!isCommunityOpen()) return closed();
  const { account } = await viewer();
  if (!isAdmin(account)) return Response.json({ error: 'Réservé à la modération.' }, { status: 403 });
  return null;
}

export async function GET() {
  const denied = await guard();
  if (denied) return denied;
  return Response.json({ reported: await reportedPosts() });
}

export async function POST(request: Request) {
  const denied = await guard();
  if (denied) return denied;
  const parsed = Action.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'Requête invalide.' }, { status: 400 });
  if ('ban' in parsed.data) await banMember(parsed.data.ban);
  else await moderate(parsed.data.postId, parsed.data.action);
  return Response.json({ ok: true });
}
