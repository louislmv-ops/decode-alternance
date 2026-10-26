// Envoie les alertes du jour : pour chaque compte, les offres publiées depuis la dernière alerte
// qui collent à sa recherche suivie, ou à défaut à son profil, ses likes et ses offres décodées, par e-mail, et par SMS pour les comptes Pro au numéro vérifié.
//   pnpm alerts             la tournée du matin, pour tout le monde
//   pnpm alerts --rapide    la tournée horaire, pour les comptes Pro seulement

import { buildAlert, pickForProfile, profileSearch } from '@/lib/account/alerts';
import { isEmailConfigured, isSmsConfigured, sendEmail, sendSms } from '@/lib/account/senders';
import { accountsDueForAlert, accountsDueHourly, isAccountsConfigured, markAlerted } from '@/lib/account/store';
import { proAccountIds } from '@/lib/pro/store';
import { listOffers } from '@/lib/offers/repository';
import { closeDb } from '@/lib/offers/store';
import type { DiplomaLevel } from '@/lib/rules/employer';
import { SITE_URL } from '@/lib/site';

async function main() {
  if (!isAccountsConfigured()) {
    console.log('Comptes non configurés (DATABASE_URL, RESEND_API_KEY) : rien à envoyer.');
    return;
  }
  const fast = process.argv.includes('--rapide');
  const pro = await proAccountIds();
  const accounts = fast ? (await accountsDueHourly()).filter((a) => pro.has(a.id)) : await accountsDueForAlert();
  let sent = 0;
  for (const account of accounts) {
    const since = account.lastAlertAt ?? new Date(Date.now() - 86_400_000);
    const followed = Object.keys(account.savedSearch).length > 0;
    if (!followed && !account.alertMatch) continue;
    const search = followed ? account.savedSearch : profileSearch(account.profile);
    const page = await listOffers({
      q: search.q,
      departments: search.dep ? [search.dep] : [],
      level: search.niveau as DiplomaLevel | undefined,
      sort: 'recent',
    });
    if (page.mode === 'exemples') break;
    const recent = page.offers.filter((o) => new Date(o.publishedAt) > since);
    // Une recherche suivie reçoit tout ; sinon, seulement ce qui ressemble vraiment au compte.
    const fresh = followed ? recent : pickForProfile(recent, account.likes, account.profile);
    if (fresh.length > 0) {
      const alert = buildAlert(fresh, search, SITE_URL);
      try {
        if (account.alertEmail && isEmailConfigured()) await sendEmail(account.email, alert.subject, alert.text);
        if (pro.has(account.id) && account.alertSms && account.phoneVerified && account.phone && isSmsConfigured()) await sendSms(account.phone, alert.sms);
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
