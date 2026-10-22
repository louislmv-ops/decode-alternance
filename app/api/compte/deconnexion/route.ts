import { cookies } from 'next/headers';
import { clearSessionCookies } from '@/lib/account/http';
import { endSession, isAccountsConfigured, SESSION_COOKIE } from '@/lib/account/store';

export async function POST() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (token && isAccountsConfigured()) await endSession(token);
  await clearSessionCookies();
  return Response.json({ ok: true });
}
