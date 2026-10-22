import 'server-only';
import { z } from 'zod/v4';
import { companyBySiren } from './search';
import { saveCompany, storedCompany } from './store';

export const firstError = (error: z.ZodError, fallback: string) => z.prettifyError(error).split('\n')[0]?.replace(/^✖\s*/, '') ?? fallback;

/** Avant la première contribution, l'entreprise est confirmée dans l'annuaire officiel puis enregistrée. */
export async function ensureCompany(siren: string): Promise<Response | null> {
  if (!/^\d{9}$/.test(siren)) return Response.json({ error: 'Entreprise introuvable.' }, { status: 404 });
  if (await storedCompany(siren)) return null;
  const ref = await companyBySiren(siren).catch(() => undefined);
  if (ref === undefined) return Response.json({ error: 'L’annuaire des entreprises ne répond pas. Réessaie dans un instant.' }, { status: 503 });
  if (!ref) return Response.json({ error: 'Entreprise introuvable.' }, { status: 404 });
  await saveCompany(ref);
  return null;
}
