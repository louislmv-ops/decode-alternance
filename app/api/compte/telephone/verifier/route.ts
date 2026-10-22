import { z } from 'zod/v4';
import { currentAccount, notConfigured, publicAccount } from '@/lib/account/http';
import { normalizeFrenchMobile } from '@/lib/account/phone';
import { checkCode, isAccountsConfigured, setVerifiedPhone, updateAccount } from '@/lib/account/store';

const Body = z.object({ phone: z.string().max(30), code: z.string().regex(/^\d{6}$/) });

export async function POST(request: Request) {
  if (!isAccountsConfigured()) return notConfigured();
  const account = await currentAccount();
  if (!account) return Response.json({ error: 'Pas connecté.' }, { status: 401 });
  const parsed = Body.safeParse(await request.json().catch(() => null));
  const phone = parsed.success ? normalizeFrenchMobile(parsed.data.phone) : null;
  if (!parsed.success || !phone) return Response.json({ error: 'Le code fait 6 chiffres.' }, { status: 400 });
  if (!(await checkCode(`tel:${account.id}:${phone}`, parsed.data.code))) {
    return Response.json({ error: 'Code incorrect ou expiré.' }, { status: 401 });
  }
  await setVerifiedPhone(account.id, phone);
  return Response.json({ account: publicAccount(await updateAccount(account.id, { alertSms: true })) });
}
