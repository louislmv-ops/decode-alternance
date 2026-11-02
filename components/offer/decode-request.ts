import type { DecodedOffer } from '@/lib/decode/schema';

/** Un message clair pour chaque échec, même quand la réponse n'est pas du JSON (délai dépassé, panne de l'hébergeur). */
const BY_STATUS: Record<number, string> = {
  429: 'Trop de décodages pour le moment. Réessaie un peu plus tard.',
  503: 'Le décodage n’est pas disponible pour le moment.',
  504: 'Le décodage a pris trop de temps. Réessaie dans un instant.',
};

/** Demande une traduction à /api/decode ; lève une erreur au message lisible en cas d'échec. */
export async function requestDecode(body: { text: string } | { offerId: string; text?: string }): Promise<DecodedOffer> {
  let res: Response;
  try {
    res = await fetch('/api/decode', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  } catch {
    throw new Error('Pas de connexion au serveur. Vérifie ton réseau et réessaie.');
  }
  const data = (await res.json().catch(() => null)) as { decoded?: DecodedOffer; error?: string } | null;
  if (res.ok && data?.decoded) return data.decoded;
  throw new Error(data?.error ?? BY_STATUS[res.status] ?? 'Le décodage a échoué. Réessaie dans un instant.');
}
