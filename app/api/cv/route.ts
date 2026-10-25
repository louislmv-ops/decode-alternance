import { isClaudeConfigured } from '@/lib/decode/claude';
import { readCvWithClaude } from '@/lib/cv/claude';
import { guessFromCv } from '@/lib/cv/extract';
import { readCv } from '@/lib/cv/read';
import { allow, clientKey } from '@/lib/rate-limit';

export const maxDuration = 60;

const MAX_BYTES = 5 * 1024 * 1024;

/** Lit un CV (PDF, Word, OpenDocument, RTF, texte ou photo) et renvoie le métier, le lieu, le niveau et l'âge devinés. Le fichier n'est pas gardé. */
export async function POST(request: Request) {
  if (!allow(clientKey(request), 20, 3_600_000)) {
    return Response.json({ error: 'Trop de CV envoyés cette heure-ci. Réessaie plus tard.' }, { status: 429 });
  }
  const form = await request.formData().catch(() => null);
  const file = form?.get('cv');
  if (!(file instanceof File)) return Response.json({ error: 'Ajoute ton CV.' }, { status: 400 });
  if (file.size > MAX_BYTES) return Response.json({ error: 'Ton CV dépasse 5 Mo.' }, { status: 413 });

  const content = await readCv(file);
  if (content.kind === 'error') return Response.json({ error: content.message }, { status: 415 });
  if (content.kind === 'image') {
    // Une photo se lit seulement avec Claude, qui ne s'entraîne pas sur les données : jamais avec une IA gratuite.
    if (!isClaudeConfigured()) return Response.json({ error: 'Les photos de CV ne sont pas encore lues ici. Envoie-le en PDF ou en Word.' }, { status: 415 });
    try {
      return Response.json({ guess: await readCvWithClaude(content), by: 'ia' });
    } catch (error) {
      console.error(error);
      return Response.json({ error: 'Impossible de lire cette photo. Envoie ton CV en PDF ou en Word.' }, { status: 422 });
    }
  }
  const text = content.text;

  if (text.trim().length < 80) {
    return Response.json({ error: 'Ce fichier ne contient pas de texte lisible (CV en image ?). Envoie-le en PDF ou en Word, ou réponds aux questions.' }, { status: 422 });
  }

  // Un CV contient des données personnelles : seulement avec Claude, jamais avec un palier gratuit.
  if (isClaudeConfigured()) {
    try {
      return Response.json({ guess: await readCvWithClaude(text), by: 'ia' });
    } catch (error) {
      console.error(error);
    }
  }
  return Response.json({ guess: guessFromCv(text), by: 'auto' });
}
