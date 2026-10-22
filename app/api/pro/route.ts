import { currentAccount } from '@/lib/account/http';
import { isAccountsConfigured } from '@/lib/account/store';
import { priceLabel } from '@/lib/pro/plan';
import { proState } from '@/lib/pro/store';
import { currentPrice, isStripeConfigured } from '@/lib/pro/stripe';

export async function GET() {
  // Sans comptes, Pro n'est simplement pas encore disponible : pas d'erreur, la page affiche « Bientôt ».
  if (!isAccountsConfigured()) return Response.json({ available: false, price: null, signedIn: false, state: null });
  const price = await currentPrice().catch(() => null);
  const account = await currentAccount();
  return Response.json({
    available: isStripeConfigured() && price !== null,
    price: price ? priceLabel(price.cents, price.currency, price.interval) : null,
    signedIn: Boolean(account),
    state: account ? await proState(account.id) : null,
  });
}
