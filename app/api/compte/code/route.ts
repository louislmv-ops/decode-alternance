import { z } from 'zod/v4';
import { notConfigured } from '@/lib/account/http';
import { sendEmail } from '@/lib/account/senders';
import { isAccountsConfigured, issueCode } from '@/lib/account/store';
import { allow, clientKey } from '@/lib/rate-limit';

const Body = z.object({ email: z.email().max(200) });

/** Envoie un code de connexion à 6 chiffres. La réponse est la même que l'adresse ait un compte ou non. */
export async function POST(request: Request) {
  if (!isAccountsConfigured()) return notConfigured();
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'Cette adresse e-mail ne semble pas valide.' }, { status: 400 });
  const email = parsed.data.email.trim().toLowerCase();
  if (!allow(`code:${clientKey(request)}`, 8, 900_000) || !allow(`code:${email}`, 4, 900_000)) {
    return Response.json({ error: 'Trop de codes demandés. Réessaie dans un quart d’heure.' }, { status: 429 });
  }
  const code = await issueCode(email);
  try {
    await sendEmail(email, `${code} est ton code Décode`, `Ton code de connexion : ${code}\n\nIl est valable 10 minutes. Si tu n'as rien demandé, ignore cet e-mail.`);
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'L’e-mail n’est pas parti. Réessaie dans un instant.' }, { status: 502 });
  }
  return Response.json({ ok: true });
}
