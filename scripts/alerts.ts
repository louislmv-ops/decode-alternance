// Envoie les alertes « nouvelles offres » (voir lib/account/run-alerts.ts).
//   pnpm alerts             la tournée du matin, pour tout le monde
//   pnpm alerts --rapide    la tournée horaire, pour les comptes Pro seulement

import { runAlerts } from '@/lib/account/run-alerts';
import { closeDb } from '@/lib/offers/store';

runAlerts(process.argv.includes('--rapide'))
  .then((r) => console.log(r ? `${r.checked} comptes vérifiés, ${r.sent} alertes envoyées.` : 'Comptes non configurés (DATABASE_URL, RESEND_API_KEY) : rien à envoyer.'))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => closeDb());
