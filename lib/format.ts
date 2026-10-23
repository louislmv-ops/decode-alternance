const euros0 = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const euros2 = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Montant en centimes vers « 989,52 € » (ou « 990 € » sans décimales). */
export function formatEuros(cents: number, decimals: 0 | 2 = 2): string {
  return (decimals === 0 ? euros0 : euros2).format(cents / 100);
}

const dateFormat = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', timeZone: 'Europe/Paris' });
const shortDate = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', timeZone: 'Europe/Paris' });

export function formatDate(iso: string, short = false): string {
  return (short ? shortDate : dateFormat).format(new Date(iso));
}

/** « aujourd'hui », « hier », « il y a 4 jours » à partir d'une date ISO. */
export function relativeDays(iso: string, now: Date = new Date()): string {
  const days = Math.floor((startOfDay(now) - startOfDay(new Date(iso))) / 86_400_000);
  if (days <= 0) return 'aujourd’hui';
  if (days === 1) return 'hier';
  if (days < 7) return `il y a ${days} jours`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return weeks === 1 ? 'il y a 1 semaine' : `il y a ${weeks} semaines`;
  }
  const months = Math.floor(days / 30);
  return months >= 12 ? 'il y a plus d’un an' : `il y a ${months} mois`;
}

export function daysBetween(fromIso: string, to: Date): number {
  return Math.round((startOfDay(to) - startOfDay(new Date(fromIso))) / 86_400_000);
}

function startOfDay(d: Date): number {
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
}
