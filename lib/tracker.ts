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
