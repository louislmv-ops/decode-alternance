// Les entreprises abonnées à la mise en avant : l'état de leur abonnement Stripe, les vues et
// les clics de leurs offres mises en avant, et les alternants intéressés qui l'ont accepté.

import type { Member } from '@/lib/community/shared';
import { db } from '@/lib/offers/store';
import { companyKey } from '@/lib/offers/normalize';
import { ensureRecruiterSchema } from '@/lib/recruiters/store';
import type { Sponsor } from './match';
import { ACTIVE_STATUSES, isSponsorActive } from './plan';

let ready: Promise<void> | null = null;

function ensureSchema(): Promise<void> {
  ready ??= (async () => {
    await ensureRecruiterSchema();
    const s = db();
    await s`create table if not exists sponsors (
      account_id uuid primary key references recruiters(account_id) on delete cascade,
      stripe_customer_id text,
      stripe_subscription_id text,
      status text,
      period_end timestamptz,
      cancel_at_period_end boolean not null default false,
      created_at timestamptz not null default now()
    )`;
    await s`create table if not exists sponsor_stats (
      account_id uuid not null references recruiters(account_id) on delete cascade,
      day date not null,
      impressions integer not null default 0,
      clicks integer not null default 0,
      primary key (account_id, day)
    )`;
  })().catch((error) => {
    ready = null;
    throw error;
  });
  return ready;
}

export interface SponsorState {
  active: boolean;
  status: string | null;
  periodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  customerId: string | null;
  subscriptionId: string | null;
}

export async function sponsorState(accountId: string): Promise<SponsorState> {
  await ensureSchema();
  const [r] = await db()<
    { status: string | null; period_end: Date | null; cancel_at_period_end: boolean; stripe_customer_id: string | null; stripe_subscription_id: string | null }[]
  >`select status, period_end, cancel_at_period_end, stripe_customer_id, stripe_subscription_id from sponsors where account_id = ${accountId}`;
  return {
    active: r ? isSponsorActive(r.status, r.period_end) : false,
    status: r?.status ?? null,
    periodEnd: r?.period_end?.toISOString() ?? null,
    cancelAtPeriodEnd: r?.cancel_at_period_end ?? false,
    customerId: r?.stripe_customer_id ?? null,
    subscriptionId: r?.stripe_subscription_id ?? null,
  };
}

export async function setSponsorCustomer(accountId: string, customerId: string): Promise<void> {
  await ensureSchema();
  await db()`insert into sponsors (account_id, stripe_customer_id) values (${accountId}, ${customerId})
    on conflict (account_id) do update set stripe_customer_id = excluded.stripe_customer_id`;
}

/** Recopie l'état d'un abonnement Stripe, retrouvé par le compte ou par le client Stripe. */
export async function applySponsorSubscription(sub: {
  accountId?: string;
  customerId: string;
  subscriptionId: string;
  status: string;
  periodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}): Promise<string | null> {
  await ensureSchema();
  const s = db();
  const [r] = sub.accountId
    ? await s<{ account_id: string }[]>`insert into sponsors (account_id, stripe_customer_id, stripe_subscription_id, status, period_end, cancel_at_period_end)
        values (${sub.accountId}, ${sub.customerId}, ${sub.subscriptionId}, ${sub.status}, ${sub.periodEnd}, ${sub.cancelAtPeriodEnd})
        on conflict (account_id) do update set stripe_customer_id = excluded.stripe_customer_id, stripe_subscription_id = excluded.stripe_subscription_id,
          status = excluded.status, period_end = excluded.period_end, cancel_at_period_end = excluded.cancel_at_period_end
        returning account_id`
    : await s<{ account_id: string }[]>`update sponsors set stripe_subscription_id = ${sub.subscriptionId}, status = ${sub.status},
          period_end = ${sub.periodEnd}, cancel_at_period_end = ${sub.cancelAtPeriodEnd}
        where stripe_customer_id = ${sub.customerId} returning account_id`;
  cache = null;
  return r?.account_id ?? null;
}

let cache: { until: number; value: Sponsor[] } | null = null;

/** Les entreprises vérifiées dont l'abonnement est actif. Relu au plus toutes les 5 minutes. */
export async function activeSponsors(): Promise<Sponsor[]> {
  if (cache && cache.until > Date.now()) return cache.value;
  await ensureSchema();
  const rows = await db()<{ account_id: string; company: string; siret: string }[]>`
    select r.account_id, r.company, r.siret from sponsors s join recruiters r on r.account_id = s.account_id
    where r.verified and s.status = any(${ACTIVE_STATUSES}) and s.period_end > now()`;
  const value = rows.map((r) => ({ accountId: r.account_id, company: r.company, siren: r.siret.slice(0, 9) }));
  cache = { until: Date.now() + 300_000, value };
  return value;
}

/** Une vue ou un clic de plus aujourd'hui (heure de Paris), sans rien savoir de la personne. */
export async function recordSponsorStat(accountId: string, kind: 'impression' | 'click'): Promise<void> {
  await ensureSchema();
  const s = db();
  const day = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Paris' });
  await s`insert into sponsor_stats (account_id, day, impressions, clicks)
    values (${accountId}, ${day}, ${kind === 'impression' ? 1 : 0}, ${kind === 'click' ? 1 : 0})
    on conflict (account_id, day) do update set
      impressions = sponsor_stats.impressions + excluded.impressions, clicks = sponsor_stats.clicks + excluded.clicks`;
}

/** Les vues et clics des derniers jours, jour par jour (heure de Paris), y compris les jours à zéro. */
export async function sponsorStats(accountId: string, days = 30): Promise<{ day: string; impressions: number; clicks: number }[]> {
  await ensureSchema();
  const rows = await db()<{ day: string; impressions: number; clicks: number }[]>`
    select to_char(d, 'YYYY-MM-DD') as day, coalesce(s.impressions, 0)::int as impressions, coalesce(s.clicks, 0)::int as clicks
    from generate_series((now() at time zone 'Europe/Paris')::date - (${days}::int - 1), (now() at time zone 'Europe/Paris')::date, interval '1 day') d
    left join sponsor_stats s on s.account_id = ${accountId} and s.day = d::date
    order by d`;
  return rows.map((r) => ({ day: r.day, impressions: r.impressions, clicks: r.clicks }));
}

/**
 * Les alternants qui ont aimé une offre de l'entreprise et qui ont accepté, à part, que ces entreprises voient leur
 * profil. Seuls ces profils-là sont montrés, sans leurs autres likes ni leur e-mail.
 */
export async function interestedCandidates(company: string, limit = 50): Promise<(Omit<Member, 'accountId'> & { liked: string[] })[]> {
  await ensureSchema();
  const key = companyKey(company);
  if (key.length < 2) return [];
  const rows = await db()<(Omit<Member, 'accountId'> & { likes: unknown })[]>`
    select m.handle, m.name, m.bio, m.domain, m.city, m.school, m.formation, m.level, m.rhythm, m.start_month as "startMonth",
      m.seeking, m.visible_to_companies as "visibleToCompanies", m.skills, m.linkedin, 0 as followers, 0 as following, 0 as posts,
      a.likes
    from members m join accounts a on a.id = m.account_id
    where m.share_likes and m.seeking and m.visible_to_companies and not m.banned and a.likes is not null
    order by m.created_at desc limit 2000`;
  const out: (Omit<Member, 'accountId'> & { liked: string[] })[] = [];
  for (const { likes, ...member } of rows) {
    const items = (likes as { likes?: { title?: string; company?: string | null }[] } | null)?.likes ?? [];
    const liked = items.filter((l) => companyKey(l.company) === key).map((l) => String(l.title ?? ''));
    if (liked.length > 0) out.push({ ...member, liked: [...new Set(liked)].slice(0, 3) });
    if (out.length >= limit) break;
  }
  return out;
}
