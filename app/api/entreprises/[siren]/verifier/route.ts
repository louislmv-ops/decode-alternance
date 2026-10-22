import { z } from 'zod/v4';
import { checkCode, issueCode } from '@/lib/account/store';
import { sendEmail } from '@/lib/account/senders';
import { ensureCompany } from '@/lib/companies/http';
import { markWorkVerified, storedCompany, workDomain } from '@/lib/companies/store';
import { closed, isCommunityOpen, viewer } from '@/lib/community/http';
import { allow } from '@/lib/rate-limit';

const Body = z.object({ email: z.string().trim().toLowerCase().max(120), code: z.string().regex(/^\d{6}$/).optional() });

/** Prouver qu'on travaille (ou a travaillé) dans l'entreprise : un code envoyé à son adresse pro. */
export async function POST(request: Request, { params }: { params: Promise<{ siren: string }> }) {
  if (!isCommunityOpen()) return closed();
  const { account } = await viewer();
  if (!account) return Response.json({ error: 'Connecte-toi d’abord.' }, { status: 401 });
  const { siren } = await params;
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'Adresse invalide.' }, { status: 400 });
  const domain = workDomain(parsed.data.email);
  if (!domain) return Response.json({ error: 'Il faut ton adresse pro, pas une messagerie perso.' }, { status: 400 });
  const missing = await ensureCompany(siren);
  if (missing) return missing;
  const target = `pro:${account.id}:${parsed.data.email}`;
  if (parsed.data.code) {
    if (!(await checkCode(target, parsed.data.code))) return Response.json({ error: 'Code incorrect ou expiré.' }, { status: 400 });
    await markWorkVerified(account.id, siren, domain);
    return Response.json({ verified: true, domain });
  }
  if (!allow(`verif:${account.id}`, 5, 3_600_000)) return Response.json({ error: 'Trop de demandes. Réessaie dans une heure.' }, { status: 429 });
  const company = await storedCompany(siren);
  const code = await issueCode(target);
  await sendEmail(
    parsed.data.email,
    `${code} : vérifie ton adresse chez ${company?.name ?? 'ton entreprise'}`,
    `Ton code : ${code}\n\nIl prouve que tu as une adresse chez ${company?.name ?? 'cette entreprise'}. Tes avis et salaires restent anonymes : cette adresse n'est jamais affichée.\n\nTu n'as rien demandé ? Ignore cet e-mail.`,
  );
  return Response.json({ sent: true });
}
