import { notConfigured, currentAccount } from '@/lib/account/http';
import { isAccountsConfigured } from '@/lib/account/store';
import { priceLabel } from '@/lib/pro/plan';
import { proState } from '@/lib/pro/store';
import { currentPrice, isStripeConfigured } from '@/lib/pro/stripe';

export async function GET() {
  if (!isAccountsConfigured()) return notConfigured();
  const price = await currentPrice().catch(() => null);
  const account = await currentAccount();
  return Response.json({
    available: isStripeConfigured() && price !== null,
    price: price ? priceLabel(price.cents, price.currency, price.interval) : null,
    signedIn: Boolean(account),
    state: account ? await proState(account.id) : null,
  });
}
