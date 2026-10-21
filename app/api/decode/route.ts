import { z } from 'zod/v4';
import { decodeOffer, DecodeError, isDecodeConfigured, MAX_OFFER_CHARS } from '@/lib/decode/claude';
import { findDecode, findOffer } from '@/lib/offers/repository';
import { isDatabaseConfigured, saveDecode } from '@/lib/offers/store';
import { allow, clientKey } from '@/lib/rate-limit';

export const maxDuration = 120;

const Body = z.union([
  z.object({ offerId: z.string().min(1).max(300) }),
  z.object({ text: z.string().trim().min(120).max(MAX_OFFER_CHARS) }),
]);

const PER_HOUR = Number(process.env.DECODE_PER_HOUR || 10);

export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json(
      { error: `Colle le texte complet de l’annonce (entre 120 et ${MAX_OFFER_CHARS.toLocaleString('fr-FR')} caractères).` },
      { status: 400 },
    );
  }

  if ('offerId' in parsed.data) {
    const cached = await findDecode(parsed.data.offerId);
    if (cached) return Response.json({ decoded: cached, cached: true });
  }

  if (!isDecodeConfigured()) {
    return Response.json({ error: 'La traduction par l’IA n’est pas encore activée sur ce site.' }, { status: 503 });
  }
  if (!allow(clientKey(request), PER_HOUR, 3_600_000)) {
    return Response.json({ error: `Tu as déjà décodé ${PER_HOUR} offres cette heure-ci. Reviens un peu plus tard.` }, { status: 429 });
  }

  try {
    if ('offerId' in parsed.data) {
      const offer = await findOffer(parsed.data.offerId);
      if (!offer) return Response.json({ error: 'Cette offre n’existe plus.' }, { status: 404 });
      const { decoded, model } = await decodeOffer(`${offer.title}\n${offer.company ?? ''}\n${offer.city ?? ''}\n\n${offer.description}`);
      if (isDatabaseConfigured() && !offer.id.startsWith('exemple:')) await saveDecode(offer.id, decoded, model);
      return Response.json({ decoded, cached: false });
    }
    // Le texte collé n'est ni gardé ni enregistré : il sert à la traduction et c'est tout.
    const { decoded } = await decodeOffer(parsed.data.text);
    return Response.json({ decoded, cached: false });
  } catch (error) {
    if (error instanceof DecodeError) return Response.json({ error: error.message }, { status: error.status });
    console.error(error);
    return Response.json({ error: 'Une erreur est survenue. Réessaie dans un instant.' }, { status: 500 });
  }
}
