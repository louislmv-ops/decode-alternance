import { closed, isCommunityOpen, viewer } from '@/lib/community/http';
import { isFollowing, memberByHandle } from '@/lib/community/store';

export async function GET(_: Request, { params }: { params: Promise<{ handle: string }> }) {
  if (!isCommunityOpen()) return closed();
  const target = await memberByHandle((await params).handle);
  if (!target) return Response.json({ error: 'Membre introuvable.' }, { status: 404 });
  const { member } = await viewer();
  const following = member ? await isFollowing(member.accountId, target.accountId) : false;
  const { accountId, ...profile } = target;
  return Response.json({ member: profile, following, me: member?.accountId === accountId });
}
