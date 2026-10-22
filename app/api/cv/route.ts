import { extractText, getDocumentProxy } from 'unpdf';
import { isDecodeConfigured } from '@/lib/decode/claude';
import { readCvWithClaude } from '@/lib/cv/claude';
import { guessFromCv } from '@/lib/cv/extract';
import { allow, clientKey } from '@/lib/rate-limit';

export const maxDuration = 60;

const MAX_BYTES = 5 * 1024 * 1024;

/** Lit un CV (PDF ou texte) et renvoie le métier, le lieu, le niveau et l'âge devinés. Le fichier n'est pas gardé. */
export async function POST(request: Request) {
  if (!allow(clientKey(request), 20, 3_600_000)) {
    return Response.json({ error: 'Trop de CV envoyés cette heure-ci. Réessaie plus tard.' }, { status: 429 });
  }
  const form = await request.formData().catch(() => null);
  const file = form?.get('cv');
  if (!(file instanceof File)) return Response.json({ error: 'Ajoute ton CV en PDF.' }, { status: 400 });
  if (file.size > MAX_BYTES) return Response.json({ error: 'Ton CV dépasse 5 Mo.' }, { status: 413 });

  let text = '';
  try {
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      const pdf = await getDocumentProxy(new Uint8Array(await file.arrayBuffer()));
      text = (await extractText(pdf, { mergePages: true })).text;
    } else if (file.type.startsWith('text/')) {
      text = await file.text();
    } else {
      return Response.json({ error: 'Envoie ton CV en PDF.' }, { status: 415 });
    }
  } catch {
    return Response.json({ error: 'Impossible de lire ce PDF. Réponds plutôt aux questions.' }, { status: 422 });
  }

  if (text.trim().length < 80) {
    return Response.json({ error: 'Ce PDF ne contient pas de texte lisible (CV en image ?). Réponds plutôt aux questions.' }, { status: 422 });
  }

  if (isDecodeConfigured()) {
    try {
      return Response.json({ guess: await readCvWithClaude(text), by: 'ia' });
    } catch (error) {
      console.error(error);
    }
  }
  return Response.json({ guess: guessFromCv(text), by: 'auto' });
}
