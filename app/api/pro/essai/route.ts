import { currentAccount, notConfigured } from '@/lib/account/http';
import { isAccountsConfigured } from '@/lib/account/store';
import { proState, startTrial } from '@/lib/pro/store';
import { isStripeConfigured } from '@/lib/pro/stripe';

/** Un mois offert, sans carte : à la fin, Pro s'arrête tout seul. */
export async function POST() {
  if (!isAccountsConfigured() || !isStripeConfigured()) return notConfigured();
  const account = await currentAccount();
  if (!account) return Response.json({ error: 'Connecte-toi d’abord.' }, { status: 401 });
  if (!(await startTrial(account.id))) return Response.json({ error: 'Tu as déjà profité du mois offert.' }, { status: 409 });
  return Response.json({ state: await proState(account.id) });
}
