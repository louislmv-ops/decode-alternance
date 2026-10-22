import { myContributions } from '@/lib/companies/store';
import { closed, isCommunityOpen, viewer } from '@/lib/community/http';

export async function GET(_: Request, { params }: { params: Promise<{ siren: string }> }) {
  if (!isCommunityOpen()) return closed();
  const { account } = await viewer();
  if (!account) return Response.json({ signedIn: false });
  const { siren } = await params;
  if (!/^\d{9}$/.test(siren)) return Response.json({ error: 'Entreprise introuvable.' }, { status: 404 });
  return Response.json({ signedIn: true, ...(await myContributions(account.id, siren)) });
}
