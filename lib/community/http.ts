import 'server-only';
import { currentAccount } from '@/lib/account/http';
import { isAccountsConfigured, type Account } from '@/lib/account/store';
import { memberByAccount, type Member } from './store';

export function isCommunityOpen(): boolean {
  return isAccountsConfigured();
}

export function closed() {
  return Response.json({ error: 'La communauté ouvre bientôt.' }, { status: 503 });
}

export function isAdmin(account: Account | null): boolean {
  if (!account) return false;
  const admins = (process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
  return admins.includes(account.email);
}

/** Le visiteur : son compte s'il est connecté, et son profil de membre s'il en a créé un. */
export async function viewer(): Promise<{ account: Account | null; member: (Member & { banned: boolean }) | null }> {
  const account = await currentAccount();
  const member = account ? await memberByAccount(account.id) : null;
  return { account, member };
}
