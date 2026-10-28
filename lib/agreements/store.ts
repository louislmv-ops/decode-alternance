// Les accords d'entreprise qui parlent de la paie des alternants, rangés par SIREN, et les archives déjà lues.

import { db } from '@/lib/offers/store';
import { ensureOnce } from '@/lib/offers/schema-once';
import type { AgreementMeta } from './parse';

export interface CompanyAgreement {
  id: string;
  title: string;
  company: string;
  signedAt: string | null;
  endsAt: string | null;
  excerpts: string[];
}

let ready: Promise<void> | null = null;

export function ensureAgreementSchema(): Promise<void> {
  ready ??= ensureOnce('agreements', async () => {
    const s = db();
    await s`create table if not exists company_agreements (
      id text primary key,
      siren text not null,
      siret text not null,
      company text not null,
      idcc text,
      title text not null,
      signed_at date,
      starts_at date,
      ends_at date,
      excerpts text[] not null,
      found_at timestamptz not null default now()
    )`;
    await s`create index if not exists company_agreements_siren on company_agreements (siren)`;
    await s`create table if not exists acco_archives (name text primary key, agreements integer not null, kept integer not null, read_at timestamptz not null default now())`;
  }).catch((error) => {
    ready = null;
    throw error;
  });
  return ready;
}

export async function saveAgreement(meta: AgreementMeta, excerpts: string[]): Promise<void> {
  await ensureAgreementSchema();
  const s = db();
  await s`
    insert into company_agreements (id, siren, siret, company, idcc, title, signed_at, starts_at, ends_at, excerpts)
    values (${meta.id}, ${meta.siret.slice(0, 9)}, ${meta.siret}, ${meta.company}, ${meta.idcc}, ${meta.title},
      ${meta.signedAt}, ${meta.startsAt}, ${meta.endsAt}, ${excerpts})
    on conflict (id) do update set excerpts = excluded.excerpts, title = excluded.title, ends_at = excluded.ends_at`;
}

export async function readArchives(): Promise<Set<string>> {
  await ensureAgreementSchema();
  const rows = await db()<{ name: string }[]>`select name from acco_archives`;
  return new Set(rows.map((r) => r.name));
}

export async function markArchive(name: string, agreements: number, kept: number): Promise<void> {
  await ensureAgreementSchema();
  await db()`insert into acco_archives (name, agreements, kept) values (${name}, ${agreements}, ${kept})
    on conflict (name) do update set agreements = excluded.agreements, kept = excluded.kept, read_at = now()`;
}

/** Les accords d'une entreprise qui parlent de la paie de ses alternants, les plus récents d'abord, encore en vigueur. */
export async function agreementsForSiren(siren: string, limit = 3): Promise<CompanyAgreement[]> {
  if (!/^\d{9}$/.test(siren)) return [];
  await ensureAgreementSchema();
  const rows = await db()<{ id: string; title: string; company: string; signed_at: Date | null; ends_at: Date | null; excerpts: string[] }[]>`
    select id, title, company, signed_at, ends_at, excerpts from company_agreements
    where siren = ${siren} and (ends_at is null or ends_at >= current_date)
    order by signed_at desc nulls last limit ${limit}`;
  const day = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : null);
  return rows.map((r) => ({ id: r.id, title: r.title, company: r.company, signedAt: day(r.signed_at), endsAt: day(r.ends_at), excerpts: r.excerpts }));
}
