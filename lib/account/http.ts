import 'server-only';
import { cookies } from 'next/headers';
import { accountFromSession, isAccountsConfigured, SESSION_COOKIE, SESSION_DAYS, SIGNED_IN_COOKIE, type Account } from './store';

export function notConfigured() {
  return Response.json({ error: 'Les comptes ne sont pas encore ouverts.' }, { status: 503 });
}

export async function currentAccount(): Promise<Account | null> {
  if (!isAccountsConfigured()) return null;
  return accountFromSession((await cookies()).get(SESSION_COOKIE)?.value);
}

export async function setSessionCookies(token: string) {
  const jar = await cookies();
  const maxAge = SESSION_DAYS * 86_400;
  jar.set(SESSION_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge });
  jar.set(SIGNED_IN_COOKIE, '1', { secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge });
}

export async function clearSessionCookies() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  jar.delete(SIGNED_IN_COOKIE);
}

/** Ce que la page a le droit de voir du compte. */
export function publicAccount(a: Account) {
  return {
    email: a.email,
    phone: a.phone,
    phoneVerified: a.phoneVerified,
    alertEmail: a.alertEmail,
    alertSms: a.alertSms,
    alertFrequency: a.alertFrequency,
    alertMatch: a.alertMatch,
    savedSearch: a.savedSearch,
    profile: a.profile,
    tracker: a.tracker,
    candidate: a.candidate,
    likes: a.likes,
  };
}

export type PublicAccount = ReturnType<typeof publicAccount>;
