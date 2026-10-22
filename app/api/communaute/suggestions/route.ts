import { closed, isCommunityOpen, viewer } from '@/lib/community/http';
import { suggestions } from '@/lib/community/store';

export async function GET() {
  if (!isCommunityOpen()) return closed();
  const { member } = await viewer();
  if (!member) return Response.json({ members: [] });
  const members = (await suggestions(member.accountId)).map((m) => ({ ...m, accountId: undefined }));
  return Response.json({ members });
}
