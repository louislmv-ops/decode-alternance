// Les campagnes d'alternance : une entreprise vérifiée annonce qu'elle recrute plusieurs alternants
// sur une période (domaines, villes, niveaux, date limite) et renvoie vers son propre formulaire.

import { z } from 'zod/v4';
import { db } from '@/lib/offers/store';
import { ensureRecruiterSchema } from './store';

/** Une entreprise a au plus 5 campagnes ouvertes à la fois. */
export const OPEN_CAMPAIGNS_MAX = 5;

const today = () => new Date().toISOString().slice(0, 10);
const inOneYear = () => new Date(Date.now() + 366 * 86_400_000).toISOString().slice(0, 10);

export const CampaignInput = z.object({
  title: z.string().trim().min(4, 'Titre trop court').max(100),
  body: z.string().trim().min(30, 'Description : 30 caractères au moins').max(2000),
  domain: z.string().trim().max(60).default(''),
  cities: z.string().trim().max(120).default(''),
  levels: z.array(z.number().int().min(3).max(7)).max(5).default([]),
  positions: z.number().int().min(1).max(999).nullable().default(null),
  startMonth: z.string().regex(/^\d{4}-\d{2}$/).nullable().default(null),
  deadline: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date limite attendue')
    .refine((d) => d >= today() && d <= inOneYear(), 'Date limite : entre aujourd’hui et dans un an'),
  applyUrl: z
    .string()
    .trim()
    .max(300)
    .refine((v) => /^https:\/\/[^\s]+\.[a-z]{2,}/i.test(v), 'Lien de candidature en https:// attendu'),
});
export type CampaignInput = z.infer<typeof CampaignInput>;

export interface Campaign extends CampaignInput {
  id: string;
  company: string;
  website: string;
  createdAt: string;
  open: boolean;
}

interface Row {
  id: string;
  title: string;
  body: string;
  domain: string;
  cities: string;
  levels: number[];
  positions: number | null;
  start_month: string | null;
  deadline: string;
  apply_url: string;
  company: string;
  website: string;
  created_at: Date;
  open: boolean;
}

const toCampaign = (r: Row): Campaign => ({
  id: r.id,
  title: r.title,
  body: r.body,
  domain: r.domain,
  cities: r.cities,
  levels: r.levels,
  positions: r.positions,
  startMonth: r.start_month,
  deadline: r.deadline,
  applyUrl: r.apply_url,
  company: r.company,
  website: r.website,
  createdAt: r.created_at.toISOString(),
  open: r.open,
});

let ready: Promise<void> | null = null;

function ensureSchema(): Promise<void> {
  ready ??= (async () => {
    await ensureRecruiterSchema();
    await db()`create table if not exists campaigns (
      id uuid primary key default gen_random_uuid(),
      recruiter_id uuid not null references recruiters(account_id) on delete cascade,
      title text not null,
      body text not null,
      domain text not null default '',
      cities text not null default '',
      levels int[] not null default '{}',
      positions int,
      start_month text,
      deadline date not null,
      apply_url text not null,
      hidden boolean not null default false,
      created_at timestamptz not null default now()
    )`;
  })().catch((error) => {
    ready = null;
    throw error;
  });
  return ready;
}

// La date limite est incluse : une campagne reste ouverte jusqu'au soir du jour indiqué, heure de Paris.
const SELECT = (s: ReturnType<typeof db>) => s`select c.id, c.title, c.body, c.domain, c.cities, c.levels, c.positions, c.start_month,
    to_char(c.deadline, 'YYYY-MM-DD') as deadline, c.apply_url, r.company, r.website, c.created_at,
    c.deadline >= (now() at time zone 'Europe/Paris')::date as open
  from campaigns c join recruiters r on r.account_id = c.recruiter_id`;

/** Les campagnes ouvertes, visibles de tous : entreprise vérifiée, non masquée, date limite pas dépassée. */
export async function openCampaigns(): Promise<Campaign[]> {
  await ensureSchema();
  const s = db();
  const rows = await s<Row[]>`${SELECT(s)} where r.verified and not c.hidden and c.deadline >= (now() at time zone 'Europe/Paris')::date
    order by c.deadline asc limit 100`;
  return rows.map(toCampaign);
}

/** Les campagnes ouvertes d'une entreprise, retrouvée par les 9 premiers chiffres du SIRET de ses recruteurs. */
export async function campaignsForSiren(siren: string): Promise<Campaign[]> {
  await ensureSchema();
  const s = db();
  const rows = await s<Row[]>`${SELECT(s)} where r.verified and not c.hidden and left(r.siret, 9) = ${siren}
    and c.deadline >= (now() at time zone 'Europe/Paris')::date order by c.deadline asc limit 10`;
  return rows.map(toCampaign);
}

export async function campaignById(id: string): Promise<Campaign | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  await ensureSchema();
  const s = db();
  const [row] = await s<Row[]>`${SELECT(s)} where c.id = ${id} and r.verified and not c.hidden`;
  return row ? toCampaign(row) : null;
}

export async function campaignsOf(recruiterId: string): Promise<Campaign[]> {
  await ensureSchema();
  const s = db();
  const rows = await s<Row[]>`${SELECT(s)} where c.recruiter_id = ${recruiterId} and not c.hidden order by c.created_at desc`;
  return rows.map(toCampaign);
}

export class CampaignRefused extends Error {}

export async function createCampaign(recruiterId: string, input: CampaignInput): Promise<Campaign> {
  await ensureSchema();
  const s = db();
  const [{ n } = { n: 0 }] = await s<{ n: number }[]>`select count(*)::int as n from campaigns
    where recruiter_id = ${recruiterId} and not hidden and deadline >= (now() at time zone 'Europe/Paris')::date`;
  if (n >= OPEN_CAMPAIGNS_MAX) throw new CampaignRefused(`${OPEN_CAMPAIGNS_MAX} campagnes ouvertes au plus. Clos-en une d’abord.`);
  const [created] = await s<{ id: string }[]>`insert into campaigns (recruiter_id, title, body, domain, cities, levels, positions, start_month, deadline, apply_url)
    values (${recruiterId}, ${input.title}, ${input.body}, ${input.domain}, ${input.cities}, ${input.levels}, ${input.positions},
      ${input.startMonth}, ${input.deadline}, ${input.applyUrl}) returning id`;
  const [row] = await s<Row[]>`${SELECT(s)} where c.id = ${created!.id}`;
  return toCampaign(row!);
}

/** Clore une campagne : son entreprise la retire, ou la modération la masque. */
export async function closeCampaign(id: string, recruiterId: string | null): Promise<boolean> {
  await ensureSchema();
  const s = db();
  const rows = recruiterId
    ? await s`update campaigns set hidden = true where id = ${id} and recruiter_id = ${recruiterId} returning id`
    : await s`update campaigns set hidden = true where id = ${id} returning id`;
  return rows.length > 0;
}
