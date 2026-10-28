import { z } from 'zod/v4';
import { currentAccount } from '@/lib/account/http';
import { DecodeError, isClaudeConfigured } from '@/lib/decode/claude';
import { findOffer } from '@/lib/offers/repository';
import { prepareInterview } from '@/lib/pro/interview';
import { allow } from '@/lib/rate-limit';

export const maxDuration = 120;

const Body = z.object({ offerId: z.string().min(1).max(300) });

/** Prépa entretien : gratuite, 20 par jour, rien n'est gardé. */
export async function POST(request: Request) {
  const account = await currentAccount();
  if (!account) return Response.json({ error: 'Connecte-toi d’abord.' }, { status: 401 });
  if (!isClaudeConfigured()) return Response.json({ error: 'L’IA n’est pas encore activée sur ce site.' }, { status: 503 });
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'Offre manquante.' }, { status: 400 });
  if (!allow(`entretien:${account.id}`, 20, 86_400_000)) return Response.json({ error: '20 préparations par jour au plus. Reviens demain.' }, { status: 429 });
  const offer = await findOffer(parsed.data.offerId);
  if (!offer) return Response.json({ error: 'Cette offre n’existe plus.' }, { status: 404 });
  try {
    const interview = await prepareInterview(`${offer.title}\n${offer.company ?? ''}\n${offer.city ?? ''}\n\n${offer.description}`);
    return Response.json({ interview });
  } catch (error) {
    if (error instanceof DecodeError) return Response.json({ error: error.message }, { status: error.status });
    console.error(error);
    return Response.json({ error: 'La préparation a échoué. Réessaie.' }, { status: 500 });
  }
}
