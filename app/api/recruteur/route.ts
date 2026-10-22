import { z } from 'zod/v4';
import { closed, isCommunityOpen, viewer } from '@/lib/community/http';
import { RecruiterInput, recruiterByAccount, saveRecruiter } from '@/lib/recruiters/store';

export async function GET() {
  if (!isCommunityOpen()) return closed();
  const { account } = await viewer();
  if (!account) return Response.json({ signedIn: false, recruiter: null });
  return Response.json({ signedIn: true, recruiter: await recruiterByAccount(account.id) });
}

/** Crée ou modifie la fiche entreprise ; elle attend ensuite d'être vérifiée. */
export async function PUT(request: Request) {
  if (!isCommunityOpen()) return closed();
  const { account } = await viewer();
  if (!account) return Response.json({ error: 'Connecte-toi d’abord.' }, { status: 401 });
  const parsed = RecruiterInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: z.prettifyError(parsed.error).split('\n')[0]?.replace(/^✖\s*/, '') ?? 'Fiche invalide.' }, { status: 400 });
  }
  return Response.json({ recruiter: await saveRecruiter(account.id, parsed.data) });
}
