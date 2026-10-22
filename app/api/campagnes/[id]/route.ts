import { closed, isAdmin, isCommunityOpen, viewer } from '@/lib/community/http';
import { closeCampaign } from '@/lib/recruiters/campaigns';

/** Clore une campagne : par son entreprise, ou par la modération. */
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isCommunityOpen()) return closed();
  const { account } = await viewer();
  if (!account) return Response.json({ error: 'Connecte-toi d’abord.' }, { status: 401 });
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return Response.json({ error: 'Campagne introuvable.' }, { status: 404 });
  const ok = await closeCampaign(id, isAdmin(account) ? null : account.id);
  return ok ? Response.json({ ok: true }) : Response.json({ error: 'Campagne introuvable.' }, { status: 404 });
}
