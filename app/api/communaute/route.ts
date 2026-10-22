import { z } from 'zod/v4';
import { closed, isCommunityOpen, viewer } from '@/lib/community/http';
import { createPost, feed, KINDS, POST_MAX } from '@/lib/community/store';
import { allow } from '@/lib/rate-limit';

const Body = z.object({
  body: z.string().trim().min(1).max(POST_MAX),
  kind: z.enum(KINDS).default('libre'),
  parentId: z.string().uuid().nullable().optional(),
});

export async function GET(request: Request) {
  if (!isCommunityOpen()) return closed();
  const url = new URL(request.url);
  const { member } = await viewer();
  const kind = KINDS.find((k) => k === url.searchParams.get('type')) ?? undefined;
  const posts = await feed({
    viewer: member?.accountId ?? null,
    scope: url.searchParams.get('fil') === 'abonnements' ? 'abonnements' : 'tout',
    kind,
    author: url.searchParams.get('membre') ?? undefined,
    before: url.searchParams.get('avant') ?? undefined,
  });
  return Response.json({ posts });
}

export async function POST(request: Request) {
  if (!isCommunityOpen()) return closed();
  const { member } = await viewer();
  if (!member) return Response.json({ error: 'Crée ton profil pour publier.' }, { status: 401 });
  if (member.banned) return Response.json({ error: 'Ton compte ne peut plus publier.' }, { status: 403 });
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: `Entre 1 et ${POST_MAX} caractères.` }, { status: 400 });
  if (!allow(`post-court:${member.accountId}`, 1, 15_000) || !allow(`post:${member.accountId}`, 20, 3_600_000)) {
    return Response.json({ error: 'Doucement : réessaie dans un instant.' }, { status: 429 });
  }
  try {
    const id = await createPost(member.accountId, parsed.data);
    return Response.json({ id });
  } catch {
    return Response.json({ error: 'Ce message n’existe plus.' }, { status: 404 });
  }
}
