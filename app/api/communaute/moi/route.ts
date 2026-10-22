import { z } from 'zod/v4';
import { closed, isAdmin, isCommunityOpen, viewer } from '@/lib/community/http';
import { HandleTaken, MemberInput, saveMember } from '@/lib/community/store';

export async function GET() {
  if (!isCommunityOpen()) return closed();
  const { account, member } = await viewer();
  return Response.json({ signedIn: Boolean(account), member, admin: isAdmin(account) });
}

/** Crée ou modifie le profil de membre. À la création, la charte doit être acceptée. */
export async function PUT(request: Request) {
  if (!isCommunityOpen()) return closed();
  const { account, member } = await viewer();
  if (!account) return Response.json({ error: 'Connecte-toi d’abord.' }, { status: 401 });
  const raw = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!member && raw?.charte !== true) return Response.json({ error: 'Accepte la charte pour rejoindre la communauté.' }, { status: 400 });
  const parsed = MemberInput.safeParse(raw);
  if (!parsed.success) return Response.json({ error: z.prettifyError(parsed.error).split('\n')[0]?.replace(/^✖\s*/, '') ?? 'Profil invalide.' }, { status: 400 });
  try {
    return Response.json({ member: await saveMember(account.id, parsed.data) });
  } catch (error) {
    if (error instanceof HandleTaken) return Response.json({ error: 'Ce pseudo est déjà pris.' }, { status: 409 });
    throw error;
  }
}
