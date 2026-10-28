import { currentAccount, notConfigured } from '@/lib/account/http';
import { isAccountsConfigured } from '@/lib/account/store';
import { recruiterByAccount } from '@/lib/recruiters/store';
import { interestedCandidates, sponsorStats, sponsorState } from '@/lib/sponsors/store';

/** Le tableau de bord de l'entreprise : l'abonnement, les vues et clics, et les alternants intéressés. */
export async function GET() {
  if (!isAccountsConfigured()) return notConfigured();
  const account = await currentAccount();
  if (!account) return Response.json({ error: 'Connecte-toi d’abord.' }, { status: 401 });
  const recruiter = await recruiterByAccount(account.id);
  if (!recruiter) return Response.json({ error: 'Inscris d’abord ton entreprise.' }, { status: 403 });
  const sponsor = await sponsorState(account.id);
  return Response.json({
    company: recruiter.company,
    verified: recruiter.verified,
    sponsor: { active: sponsor.active, status: sponsor.status, periodEnd: sponsor.periodEnd, cancelAtPeriodEnd: sponsor.cancelAtPeriodEnd, billing: Boolean(sponsor.customerId) },
    stats: sponsor.active || sponsor.customerId ? await sponsorStats(account.id) : [],
    // Les alternants intéressés : réservés aux entreprises vérifiées qui financent la mise en avant.
    candidates: recruiter.verified && sponsor.active ? await interestedCandidates(recruiter.company) : [],
  });
}
