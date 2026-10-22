import { z } from 'zod/v4';
import { closed, isCommunityOpen, viewer } from '@/lib/community/http';
import { CampaignInput, CampaignRefused, campaignsOf, createCampaign, openCampaigns } from '@/lib/recruiters/campaigns';
import { recruiterByAccount } from '@/lib/recruiters/store';

/** Toutes les campagnes ouvertes, ou celles de l'entreprise connectée avec ?moi=1. */
export async function GET(request: Request) {
  if (!isCommunityOpen()) return closed();
  if (new URL(request.url).searchParams.get('moi')) {
    const { account } = await viewer();
    if (!account) return Response.json({ error: 'Connecte-toi d’abord.' }, { status: 401 });
    return Response.json({ campaigns: await campaignsOf(account.id) });
  }
  return Response.json({ campaigns: await openCampaigns() });
}

export async function POST(request: Request) {
  if (!isCommunityOpen()) return closed();
  const { account } = await viewer();
  const recruiter = account ? await recruiterByAccount(account.id) : null;
  if (!account || !recruiter?.verified) return Response.json({ error: 'Réservé aux entreprises vérifiées.' }, { status: 403 });
  const parsed = CampaignInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: z.prettifyError(parsed.error).split('\n')[0]?.replace(/^✖\s*/, '') ?? 'Campagne invalide.' }, { status: 400 });
  }
  try {
    return Response.json({ campaign: await createCampaign(account.id, parsed.data) });
  } catch (error) {
    if (error instanceof CampaignRefused) return Response.json({ error: error.message }, { status: 409 });
    throw error;
  }
}
