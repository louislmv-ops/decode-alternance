// Envoie les alertes du jour : pour chaque compte qui suit une recherche, les offres publiées
// depuis la dernière alerte, par e-mail et par SMS si le numéro est vérifié.
//   pnpm alerts

import { buildAlert } from '@/lib/account/alerts';
import { isEmailConfigured, isSmsConfigured, sendEmail, sendSms } from '@/lib/account/senders';
import { accountsDueForAlert, isAccountsConfigured, markAlerted } from '@/lib/account/store';
import { listOffers } from '@/lib/offers/repository';
import { closeDb } from '@/lib/offers/store';
import type { DiplomaLevel } from '@/lib/rules/employer';
import { SITE_URL } from '@/lib/site';

async function main() {
  if (!isAccountsConfigured()) {
    console.log('Comptes non configurés (DATABASE_URL, RESEND_API_KEY) : rien à envoyer.');
    return;
  }
  const accounts = await accountsDueForAlert();
  let sent = 0;
  for (const account of accounts) {
    const since = account.lastAlertAt ?? new Date(Date.now() - 86_400_000);
    const page = await listOffers({ q: account.savedSearch.q, department: account.savedSearch.dep, level: account.savedSearch.niveau as DiplomaLevel | undefined });
    if (page.mode === 'exemples') break;
    const fresh = page.offers.filter((o) => new Date(o.publishedAt) > since);
    if (fresh.length > 0) {
      const alert = buildAlert(fresh, account.savedSearch, SITE_URL);
      try {
        if (account.alertEmail && isEmailConfigured()) await sendEmail(account.email, alert.subject, alert.text);
        if (account.alertSms && account.phoneVerified && account.phone && isSmsConfigured()) await sendSms(account.phone, alert.sms);
        sent += 1;
      } catch (error) {
        console.error(`Alerte non envoyée pour un compte : ${(error as Error).message}`);
        continue;
      }
    }
    await markAlerted(account.id);
  }
  console.log(`${accounts.length} comptes vérifiés, ${sent} alertes envoyées.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => closeDb());
