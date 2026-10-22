import Link from 'next/link';
import { formatMonth, LEVEL_SHORT } from '@/lib/community/shared';
import type { Campaign } from '@/lib/recruiters/campaigns';

/** « 2027-03-15 » devient « 15 mars ». */
export function formatDeadline(day: string): string {
  return new Date(`${day}T12:00:00Z`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', timeZone: 'Europe/Paris' });
}

/** Jours restants avant la date limite incluse, à l'heure de Paris. */
export function daysLeft(day: string, now = new Date()): number {
  const todayParis = now.toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' });
  return Math.round((Date.parse(`${day}T00:00:00Z`) - Date.parse(`${todayParis}T00:00:00Z`)) / 86_400_000);
}

export function campaignFacts(c: Campaign): string[] {
  const start = formatMonth(c.startMonth);
  return [
    c.positions ? `${c.positions} poste${c.positions > 1 ? 's' : ''}` : null,
    c.domain,
    c.cities,
    c.levels.length ? c.levels.map((l) => LEVEL_SHORT[l]).join(', ') : null,
    start ? `dès ${start}` : null,
  ].filter((x): x is string => Boolean(x));
}

export function Deadline({ day }: { day: string }) {
  const left = daysLeft(day);
  return (
    <span className={`k-deadline${left <= 7 ? ' is-soon' : ''}`}>
      {left === 0 ? 'Dernier jour' : left === 1 ? 'Jusqu’à demain' : `Jusqu’au ${formatDeadline(day)}`}
    </span>
  );
}

export function CampaignCard({ campaign: c }: { campaign: Campaign }) {
  return (
    <Link href={`/campagnes/${c.id}`} className="k-card">
      <span className="k-card__company">{c.company}</span>
      <span className="k-card__title">{c.title}</span>
      <span className="k-card__facts">{campaignFacts(c).join(' · ')}</span>
      <Deadline day={c.deadline} />
    </Link>
  );
}
