import { z } from 'zod/v4';
import { currentAccount, notConfigured } from '@/lib/account/http';
import { normalizeFrenchMobile } from '@/lib/account/phone';
import { isSmsConfigured, sendSms } from '@/lib/account/senders';
import { isAccountsConfigured, issueCode, removePhone } from '@/lib/account/store';
import { allow } from '@/lib/rate-limit';

const Body = z.object({ phone: z.string().max(30) });

/** Envoie un code par SMS pour vérifier le numéro avant toute alerte. */
export async function POST(request: Request) {
  if (!isAccountsConfigured() || !isSmsConfigured()) return notConfigured();
  const account = await currentAccount();
  if (!account) return Response.json({ error: 'Pas connecté.' }, { status: 401 });
  const parsed = Body.safeParse(await request.json().catch(() => null));
  const phone = parsed.success ? normalizeFrenchMobile(parsed.data.phone) : null;
  if (!phone) return Response.json({ error: 'Entre un numéro de portable français.' }, { status: 400 });
  // Un SMS coûte : trois par heure et par compte au plus.
  if (!allow(`sms:${account.id}`, 3, 3_600_000)) return Response.json({ error: 'Trop de SMS envoyés. Réessaie plus tard.' }, { status: 429 });
  const code = await issueCode(`tel:${account.id}:${phone}`);
  try {
    await sendSms(phone, `Decode : ton code est ${code}. Valable 10 minutes.`);
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Le SMS n’est pas parti. Réessaie dans un instant.' }, { status: 502 });
  }
  return Response.json({ ok: true, phone });
}

export async function DELETE() {
  if (!isAccountsConfigured()) return notConfigured();
  const account = await currentAccount();
  if (!account) return Response.json({ error: 'Pas connecté.' }, { status: 401 });
  await removePhone(account.id);
  return Response.json({ ok: true });
}
