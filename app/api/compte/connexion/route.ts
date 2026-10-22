import { z } from 'zod/v4';
import { notConfigured, publicAccount, setSessionCookies } from '@/lib/account/http';
import { checkCode, createSession, findOrCreateAccount, isAccountsConfigured } from '@/lib/account/store';
import { allow, clientKey } from '@/lib/rate-limit';

const Body = z.object({ email: z.email().max(200), code: z.string().regex(/^\d{6}$/) });

/** Vérifie le code ; crée le compte au premier passage et ouvre une session de 90 jours. */
export async function POST(request: Request) {
  if (!isAccountsConfigured()) return notConfigured();
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'Le code fait 6 chiffres.' }, { status: 400 });
  if (!allow(`connexion:${clientKey(request)}`, 20, 900_000)) {
    return Response.json({ error: 'Trop d’essais. Réessaie dans un quart d’heure.' }, { status: 429 });
  }
  const email = parsed.data.email.trim().toLowerCase();
  if (!(await checkCode(email, parsed.data.code))) {
    return Response.json({ error: 'Code incorrect ou expiré.' }, { status: 401 });
  }
  const account = await findOrCreateAccount(email);
  await setSessionCookies(await createSession(account.id));
  return Response.json({ account: publicAccount(account) });
}
