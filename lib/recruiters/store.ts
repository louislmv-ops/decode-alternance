// L'espace entreprise : des recruteurs (un compte + une entreprise identifiée par son SIRET),
// vérifiés à la main avant de pouvoir contacter qui que ce soit, et le journal de leurs contacts.

import { z } from 'zod/v4';
import { ensureCommunitySchema } from '@/lib/community/store';
import type { Member } from '@/lib/community/shared';
import { db } from '@/lib/offers/store';
import { isValidSiret } from './siret';

/** Un recruteur vérifié peut contacter au plus 20 alternants par jour. */
export const CONTACTS_PER_DAY = 20;

export const RecruiterInput = z.object({
  company: z.string().trim().min(2).max(80),
  siret: z
    .string()
    .transform((v) => v.replace(/\s/g, ''))
    .refine(isValidSiret, 'SIRET invalide (14 chiffres)'),
  website: z
    .string()
    .trim()
    .max(200)
    .refine((v) => v === '' || /^https?:\/\/[^\s]+\.[a-z]{2,}/i.test(v), 'Adresse du site invalide')
    .default(''),
  contactName: z.string().trim().min(2).max(60),
  role: z.string().trim().max(60).default(''),
});
export type RecruiterInput = z.infer<typeof RecruiterInput>;

export interface Recruiter {
  accountId: string;
  company: string;
  siret: string;
  website: string;
  contactName: string;
  role: string;
  verified: boolean;
}

interface RecruiterRow {
  account_id: string;
  company: string;
  siret: string;
  website: string;
  contact_name: string;
  role: string;
  verified: boolean;
}

const toRecruiter = (r: RecruiterRow): Recruiter => ({
  accountId: r.account_id,
  company: r.company,
  siret: r.siret,
  website: r.website,
  contactName: r.contact_name,
  role: r.role,
  verified: r.verified,
});

let ready: Promise<void> | null = null;

function ensureSchema(): Promise<void> {
  ready ??= (async () => {
    await ensureCommunitySchema();
    const s = db();
    await s`create table if not exists recruiters (
      account_id uuid primary key references accounts(id) on delete cascade,
      company text not null,
      siret text not null,
      website text not null default '',
      contact_name text not null,
      role text not null default '',
      verified boolean not null default false,
      created_at timestamptz not null default now()
    )`;
    await s`create table if not exists recruiter_contacts (
      recruiter_id uuid not null references recruiters(account_id) on delete cascade,
      member_id uuid not null references members(account_id) on delete cascade,
      message text not null,
      created_at timestamptz not null default now()
    )`;
  })().catch((error) => {
    ready = null;
    throw error;
  });
  return ready;
}

export async function recruiterByAccount(accountId: string): Promise<Recruiter | null> {
  await ensureSchema();
  const [row] = await db()<RecruiterRow[]>`select * from recruiters where account_id = ${accountId}`;
  return row ? toRecruiter(row) : null;
}

/** Créer ou modifier la fiche entreprise. Changer d'entreprise ou de SIRET remet la vérification à zéro. */
export async function saveRecruiter(accountId: string, input: RecruiterInput): Promise<Recruiter> {
  await ensureSchema();
  const [row] = await db()<RecruiterRow[]>`insert into recruiters (account_id, company, siret, website, contact_name, role)
    values (${accountId}, ${input.company}, ${input.siret}, ${input.website}, ${input.contactName}, ${input.role})
    on conflict (account_id) do update set
      verified = recruiters.verified and recruiters.siret = excluded.siret and recruiters.company = excluded.company,
      company = excluded.company, siret = excluded.siret, website = excluded.website,
      contact_name = excluded.contact_name, role = excluded.role
    returning *`;
  return toRecruiter(row!);
}

export interface CandidateQuery {
  domain?: string;
  department?: string;
  level?: number;
  startBefore?: string;
}

/** Les alternants qui cherchent et qui ont accepté d'être vus par les entreprises. */
export async function searchCandidates(q: CandidateQuery): Promise<Omit<Member, 'accountId'>[]> {
  await ensureSchema();
  const s = db();
  const conditions = [s`m.seeking`, s`m.visible_to_companies`, s`not m.banned`];
  if (q.domain) conditions.push(s`(m.domain ilike ${`%${q.domain}%`} or m.formation ilike ${`%${q.domain}%`} or ${q.domain} ilike any(m.skills))`);
  if (q.department) conditions.push(s`m.city ilike ${`%${q.department}%`}`);
  if (q.level) conditions.push(s`m.level = ${q.level}`);
  if (q.startBefore) conditions.push(s`(m.start_month is null or m.start_month <= ${q.startBefore})`);
  const where = conditions.reduce((acc, c) => s`${acc} and ${c}`);
  const rows = await s<(Member & Record<string, unknown>)[]>`select m.handle, m.name, m.bio, m.domain, m.city, m.school, m.formation, m.level,
      m.rhythm, m.start_month as "startMonth", m.seeking, m.visible_to_companies as "visibleToCompanies", m.skills, m.linkedin,
      0 as followers, 0 as following, 0 as posts
    from members m where ${where} order by m.created_at desc limit 60`;
  return rows;
}

export class ContactRefused extends Error {}

/** Enregistre un contact et renvoie l'adresse du candidat, à qui le message part sans que le recruteur la voie. */
export async function recordContact(recruiterId: string, handle: string, message: string): Promise<{ email: string; name: string }> {
  await ensureSchema();
  const s = db();
  const [target] = await s<{ account_id: string; name: string; email: string }[]>`select m.account_id, m.name, a.email
    from members m join accounts a on a.id = m.account_id
    where m.handle = ${handle.toLowerCase()} and m.seeking and m.visible_to_companies and not m.banned`;
  if (!target) throw new ContactRefused('Ce profil n’est plus visible.');
  const [{ n } = { n: 0 }] = await s<{ n: number }[]>`select count(*)::int as n from recruiter_contacts
    where recruiter_id = ${recruiterId} and created_at > now() - interval '1 day'`;
  if (n >= CONTACTS_PER_DAY) throw new ContactRefused(`Maximum ${CONTACTS_PER_DAY} contacts par jour.`);
  const [{ already } = { already: false }] = await s<{ already: boolean }[]>`select exists(select 1 from recruiter_contacts
    where recruiter_id = ${recruiterId} and member_id = ${target.account_id} and created_at > now() - interval '7 days') as already`;
  if (already) throw new ContactRefused('Tu as déjà contacté ce profil cette semaine.');
  await s`insert into recruiter_contacts (recruiter_id, member_id, message) values (${recruiterId}, ${target.account_id}, ${message})`;
  return { email: target.email, name: target.name };
}

export async function pendingRecruiters(): Promise<(Recruiter & { email: string })[]> {
  await ensureSchema();
  const rows = await db()<(RecruiterRow & { email: string })[]>`select r.*, a.email from recruiters r join accounts a on a.id = r.account_id
    where not r.verified order by r.created_at`;
  return rows.map((r) => ({ ...toRecruiter(r), email: r.email }));
}

export async function setRecruiterVerified(accountId: string, verified: boolean): Promise<void> {
  await ensureSchema();
  await db()`update recruiters set verified = ${verified} where account_id = ${accountId}`;
}
