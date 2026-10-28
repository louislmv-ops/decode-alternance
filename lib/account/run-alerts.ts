// La tournée des alertes, partagée par le script (GitHub Actions) et la route du cron Vercel.
// Envoie les alertes du jour : pour chaque compte, les offres publiées depuis la dernière alerte
// qui collent à sa recherche suivie, ou à défaut à son profil, ses likes et ses offres décodées, par e-mail, et par SMS
// (une fois par semaine au plus : chaque SMS est payé) pour les comptes au numéro vérifié. Tout est gratuit pour les étudiants.

import { buildAlert, pickForProfile, profileSearch } from '@/lib/account/alerts';
import { isEmailConfigured, isSmsConfigured, sendEmail, sendSms } from '@/lib/account/senders';
import { accountsDueForAlert, claimWeeklySms, isAccountsConfigured, markAlerted } from '@/lib/account/store';
import { listOffers } from '@/lib/offers/repository';
import type { DiplomaLevel } from '@/lib/rules/employer';
import { SITE_URL } from '@/lib/site';

export async function runAlerts(): Promise<{ checked: number; sent: number } | null> {
  if (!isAccountsConfigured()) return null;
  const accounts = await accountsDueForAlert();
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
        if (account.alertSms && account.phoneVerified && account.phone && isSmsConfigured() && (await claimWeeklySms(account.id))) await sendSms(account.phone, alert.sms);
        sent += 1;
      } catch (error) {
        console.error(`Alerte non envoyée pour un compte : ${(error as Error).message}`);
        continue;
      }
    }
    await markAlerted(account.id);
  }
  return { checked: accounts.length, sent };
}
