import { currentAccount } from '@/lib/account/http';
import { isAccountsConfigured } from '@/lib/account/store';
import { recruiterByAccount } from '@/lib/recruiters/store';
import { priceLabel } from '@/lib/sponsors/plan';
import { sponsorState } from '@/lib/sponsors/store';
import { currentPrice, isStripeConfigured } from '@/lib/sponsors/stripe';

/** Ce que la page entreprises affiche : le prix de Stripe, et l'état de l'entreprise connectée. */
export async function GET() {
  // Sans comptes ni Stripe, la mise en avant n'est simplement pas encore ouverte : la page affiche « Bientôt ».
  if (!isAccountsConfigured()) return Response.json({ available: false, price: null, signedIn: false, recruiter: null, sponsor: null });
  const price = await currentPrice().catch(() => null);
  const account = await currentAccount();
  const recruiter = account ? await recruiterByAccount(account.id) : null;
  const sponsor = recruiter ? await sponsorState(recruiter.accountId) : null;
  return Response.json({
    available: isStripeConfigured() && price !== null,
    price: price ? priceLabel(price.cents, price.currency, price.interval) : null,
    signedIn: Boolean(account),
    recruiter: recruiter ? { company: recruiter.company, verified: recruiter.verified } : null,
    sponsor: sponsor ? { active: sponsor.active, status: sponsor.status, periodEnd: sponsor.periodEnd, cancelAtPeriodEnd: sponsor.cancelAtPeriodEnd } : null,
  });
}
