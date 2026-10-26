// Le suivi des candidatures : une liste gardée sur l'appareil, des relances calculées, des statistiques simples.

export type Channel = 'offre' | 'spontanee' | 'linkedin' | 'reseau';
export type Status = 'a-envoyer' | 'envoyee' | 'relancee' | 'entretien' | 'refus' | 'acceptee';

export const CHANNELS: { value: Channel; label: string }[] = [
  { value: 'offre', label: 'Réponse à une offre' },
  { value: 'spontanee', label: 'Candidature spontanée' },
  { value: 'linkedin', label: 'Message LinkedIn' },
  { value: 'reseau', label: 'Réseau, école, proche' },
];

export const STATUSES: { value: Status; label: string }[] = [
  { value: 'a-envoyer', label: 'À envoyer' },
  { value: 'envoyee', label: 'Envoyée' },
  { value: 'relancee', label: 'Relancée' },
  { value: 'entretien', label: 'Entretien' },
  { value: 'refus', label: 'Refus' },
  { value: 'acceptee', label: 'Acceptée' },
];

export interface Application {
  id: string;
  company: string;
  title: string;
  url: string;
  channel: Channel;
  status: Status;
  /** Date d'envoi (AAAA-MM-JJ), vide tant que ce n'est pas envoyé. */
  sentAt: string | null;
  followedUpAt: string | null;
  notes: string;
}

export const TRACKER_KEY = 'decode.suivi';

/** Délai avant de relancer une candidature restée sans réponse. */
export const FOLLOW_UP_DAYS = 7;

const DAY = 86_400_000;

function day(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

export function todayIso(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Date à laquelle relancer, ou null quand il n'y a rien à relancer. Une seule relance par candidature. */
export function followUpDate(app: Application): string | null {
  if (app.status !== 'envoyee' || !app.sentAt) return null;
  const date = new Date(day(app.sentAt) + FOLLOW_UP_DAYS * DAY);
  return date.toISOString().slice(0, 10);
}

export function isFollowUpDue(app: Application, today: string): boolean {
  const due = followUpDate(app);
  return due !== null && day(due) <= day(today);
}

export function daysSince(iso: string, today: string): number {
  return Math.round((day(today) - day(iso)) / DAY);
}

const ANSWERED: Status[] = ['entretien', 'refus', 'acceptee'];
const SENT: Status[] = ['envoyee', 'relancee', ...ANSWERED];

export interface ChannelStats {
  channel: Channel;
  sent: number;
  answered: number;
  interviews: number;
}

export interface TrackerStats {
  sent: number;
  answered: number;
  interviews: number;
  /** Part des candidatures envoyées qui ont reçu une réponse, en pour cent arrondi ; null sans envoi. */
  answerRate: number | null;
  byChannel: ChannelStats[];
}

export function stats(apps: Application[]): TrackerStats {
  const sentApps = apps.filter((a) => SENT.includes(a.status));
  const answered = sentApps.filter((a) => ANSWERED.includes(a.status)).length;
  const interviews = sentApps.filter((a) => a.status === 'entretien' || a.status === 'acceptee').length;
  return {
    sent: sentApps.length,
    answered,
    interviews,
    answerRate: sentApps.length > 0 ? Math.round((answered / sentApps.length) * 100) : null,
    byChannel: CHANNELS.map(({ value }) => {
      const list = sentApps.filter((a) => a.channel === value);
      return {
        channel: value,
        sent: list.length,
        answered: list.filter((a) => ANSWERED.includes(a.status)).length,
        interviews: list.filter((a) => a.status === 'entretien' || a.status === 'acceptee').length,
      };
    }),
  };
}

export function sanitizeApplications(raw: unknown): Application[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((a): a is Record<string, unknown> => Boolean(a) && typeof a === 'object')
    .map((a) => ({
      id: typeof a.id === 'string' ? a.id : crypto.randomUUID(),
      company: String(a.company ?? '').slice(0, 120),
      title: String(a.title ?? '').slice(0, 160),
      url: typeof a.url === 'string' && /^https?:\/\//.test(a.url) ? a.url : '',
      channel: CHANNELS.some((c) => c.value === a.channel) ? (a.channel as Channel) : 'offre',
      status: STATUSES.some((s) => s.value === a.status) ? (a.status as Status) : 'a-envoyer',
      sentAt: typeof a.sentAt === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(a.sentAt) ? a.sentAt : null,
      followedUpAt: typeof a.followedUpAt === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(a.followedUpAt) ? a.followedUpAt : null,
      notes: String(a.notes ?? '').slice(0, 1000),
    }))
    .filter((a) => a.company || a.title);
}

export interface WeekBar {
  /** Lundi de la semaine (AAAA-MM-JJ). */
  start: string;
  sent: number;
}

/** Les envois des dernières semaines, du plus ancien au plus récent, semaine en cours comprise. */
export function weekly(apps: Application[], today: string, weeks = 8): WeekBar[] {
  const t = day(today);
  const monday = t - ((new Date(t).getUTCDay() + 6) % 7) * DAY;
  const bars = Array.from({ length: weeks }, (_, i) => ({ start: new Date(monday - (weeks - 1 - i) * 7 * DAY).toISOString().slice(0, 10), sent: 0 }));
  const first = monday - (weeks - 1) * 7 * DAY;
  for (const a of apps) {
    if (!a.sentAt) continue;
    const d = day(a.sentAt);
    if (d < first || d > t) continue;
    bars[Math.min(weeks - 1, Math.floor((d - first) / (7 * DAY)))]!.sent += 1;
  }
  return bars;
}

export interface FunnelStep {
  label: string;
  count: number;
}

/** De l'idée à la signature : combien de candidatures ont franchi chaque étape. */
export function funnel(apps: Application[]): FunnelStep[] {
  const sentApps = apps.filter((a) => SENT.includes(a.status));
  return [
    { label: 'Ajoutées', count: apps.length },
    { label: 'Envoyées', count: sentApps.length },
    { label: 'Réponses', count: sentApps.filter((a) => ANSWERED.includes(a.status)).length },
    { label: 'Entretiens', count: sentApps.filter((a) => a.status === 'entretien' || a.status === 'acceptee').length },
    { label: 'Acceptées', count: sentApps.filter((a) => a.status === 'acceptee').length },
  ];
}

/** Quelques constats tirés du suivi, seulement quand les chiffres suffisent à dire quelque chose. */
export function observations(apps: Application[], today: string): string[] {
  const out: string[] = [];
  const s = stats(apps);
  if (s.sent === 0) return apps.length > 0 ? ['Rien d’envoyé pour l’instant : marque « Envoyée » dès que c’est parti.'] : [];

  const weeks = weekly(apps, today, 4);
  const thisWeek = weeks[3]!.sent;
  const avg = Math.round((weeks.slice(0, 3).reduce((n, w) => n + w.sent, 0) / 3) * 10) / 10;
  if (thisWeek === 0 && avg > 0) out.push(`Aucun envoi cette semaine, contre ${String(avg).replace('.', ',')} en moyenne avant.`);
  else if (thisWeek > avg && avg > 0) out.push(`Bon rythme : ${thisWeek} envoi${thisWeek > 1 ? 's' : ''} cette semaine, plus que ta moyenne.`);

  const ranked = s.byChannel.filter((c) => c.sent >= 3).sort((a, b) => b.answered / b.sent - a.answered / a.sent);
  if (ranked.length >= 2 && ranked[0]!.answered > 0) {
    const best = ranked[0]!;
    out.push(`${CHANNELS.find((c) => c.value === best.channel)!.label} te répond le mieux : ${Math.round((best.answered / best.sent) * 100)} % de réponses.`);
  }

  const silent = apps.filter((a) => (a.status === 'envoyee' || a.status === 'relancee') && a.sentAt && daysSince(a.sentAt, today) > 21).length;
  if (silent > 0) out.push(`${silent} candidature${silent > 1 ? 's' : ''} sans réponse depuis plus de 3 semaines.`);

  const toSend = apps.filter((a) => a.status === 'a-envoyer').length;
  if (toSend > 0) out.push(`${toSend} candidature${toSend > 1 ? 's' : ''} encore à envoyer.`);

  if (s.sent < 10) out.push('Les taux deviennent parlants vers 10 envois.');
  return out;
}
