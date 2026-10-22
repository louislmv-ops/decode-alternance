import { closed, isAdmin, isCommunityOpen, viewer } from '@/lib/community/http';
import { deletePost, thread } from '@/lib/community/store';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Ctx) {
  if (!isCommunityOpen()) return closed();
  const { member } = await viewer();
  const t = await thread((await params).id, member?.accountId ?? null);
  return t ? Response.json(t) : Response.json({ error: 'Message introuvable.' }, { status: 404 });
}

export async function DELETE(_: Request, { params }: Ctx) {
  if (!isCommunityOpen()) return closed();
  const { account, member } = await viewer();
  if (!member || !account) return Response.json({ error: 'Pas connecté.' }, { status: 401 });
  const ok = await deletePost((await params).id, member.accountId, isAdmin(account));
  return ok ? Response.json({ ok }) : Response.json({ error: 'Impossible de supprimer ce message.' }, { status: 403 });
}
