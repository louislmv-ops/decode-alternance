import { createHash, randomBytes, randomInt } from 'node:crypto';
import { z } from 'zod/v4';
import { db, isDatabaseConfigured } from '@/lib/offers/store';
import { isEmailConfigured } from './senders';

// Les comptes : une adresse e-mail, des préférences d'alerte, et une copie du profil et du suivi
// pour les retrouver sur un autre appareil. Connexion par code à 6 chiffres, sans mot de passe.

export const SESSION_COOKIE = 'decode_session';
/** Cookie lisible par la page, seulement pour savoir qu'on est connecté. */
export const SIGNED_IN_COOKIE = 'decode_connecte';
export const SESSION_DAYS = 90;
const CODE_MINUTES = 10;
const MAX_ATTEMPTS = 5;

export function isAccountsConfigured(): boolean {
  return isDatabaseConfigured() && isEmailConfigured();
}

let schemaReady: Promise<void> | null = null;

/** Les tables des comptes sont créées au premier usage : rien à lancer à la main. */
export function ensureSchema(): Promise<void> {
  schemaReady ??= (async () => {
    const s = db();
    await s`create table if not exists accounts (
      id uuid primary key default gen_random_uuid(),
      email text unique not null,
      phone text,
      phone_verified boolean not null default false,
      alert_email boolean not null default true,
      alert_sms boolean not null default false,
      alert_frequency text not null default 'quotidien' check (alert_frequency in ('quotidien', 'hebdo')),
      saved_search jsonb not null default '{}'::jsonb,
      profile jsonb,
      tracker jsonb,
      last_alert_at timestamptz,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )`;
    await s`create table if not exists login_codes (
      target text primary key,
      code_hash text not null,
      expires_at timestamptz not null,
      attempts int not null default 0
    )`;
    await s`create table if not exists sessions (
      token_hash text primary key,
      account_id uuid not null references accounts(id) on delete cascade,
      expires_at timestamptz not null
    )`;
  })().catch((error) => {
    schemaReady = null;
    throw error;
  });
  return schemaReady;
}

function hash(value: string): string {
  return createHash('sha256').update(`${process.env.AUTH_SECRET ?? ''}:${value}`).digest('hex');
}

export const SavedSearch = z.object({
  q: z.string().max(80).optional(),
  dep: z.string().regex(/^(\d{2,3}|2[AB])$/).optional(),
  niveau: z.number().int().min(3).max(7).optional(),
});
export type SavedSearch = z.infer<typeof SavedSearch>;

export interface Account {
  id: string;
  email: string;
  phone: string | null;
  phoneVerified: boolean;
  alertEmail: boolean;
  alertSms: boolean;
  alertFrequency: 'quotidien' | 'hebdo';
  savedSearch: SavedSearch;
  profile: unknown;
  tracker: unknown;
}

interface AccountRow {
  id: string;
  email: string;
  phone: string | null;
  phone_verified: boolean;
  alert_email: boolean;
  alert_sms: boolean;
  alert_frequency: 'quotidien' | 'hebdo';
  saved_search: SavedSearch;
  profile: unknown;
  tracker: unknown;
  last_alert_at: Date | null;
}

function toAccount(r: AccountRow): Account {
  return {
    id: r.id,
    email: r.email,
    phone: r.phone,
    phoneVerified: r.phone_verified,
    alertEmail: r.alert_email,
    alertSms: r.alert_sms,
    alertFrequency: r.alert_frequency,
    savedSearch: r.saved_search ?? {},
    profile: r.profile,
    tracker: r.tracker,
  };
}

/** Crée un code pour une cible (une adresse e-mail, ou « tel:<compte>:<numéro> ») et le renvoie, en clair, pour l'envoyer. */
export async function issueCode(target: string): Promise<string> {
  await ensureSchema();
  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  await db()`insert into login_codes (target, code_hash, expires_at, attempts)
    values (${target}, ${hash(code)}, now() + ${`${CODE_MINUTES} minutes`}::interval, 0)
    on conflict (target) do update set code_hash = excluded.code_hash, expires_at = excluded.expires_at, attempts = 0`;
  return code;
}

/** Vérifie un code ; il ne sert qu'une fois et tombe après 5 essais ratés. */
export async function checkCode(target: string, code: string): Promise<boolean> {
  await ensureSchema();
  const s = db();
  const [row] = await s<{ code_hash: string; expires_at: Date; attempts: number }[]>`select code_hash, expires_at, attempts from login_codes where target = ${target}`;
  if (!row || row.expires_at < new Date() || row.attempts >= MAX_ATTEMPTS) return false;
  if (row.code_hash !== hash(code)) {
    await s`update login_codes set attempts = attempts + 1 where target = ${target}`;
    return false;
  }
  await s`delete from login_codes where target = ${target}`;
  return true;
}

export async function findOrCreateAccount(email: string): Promise<Account> {
  await ensureSchema();
  const [row] = await db()<AccountRow[]>`insert into accounts (email) values (${email})
    on conflict (email) do update set updated_at = accounts.updated_at returning *`;
  return toAccount(row!);
}

export async function createSession(accountId: string): Promise<string> {
  await ensureSchema();
  const token = randomBytes(32).toString('base64url');
  await db()`insert into sessions (token_hash, account_id, expires_at)
    values (${hash(token)}, ${accountId}, now() + ${`${SESSION_DAYS} days`}::interval)`;
  return token;
}

export async function accountFromSession(token: string | undefined): Promise<Account | null> {
  if (!token || !isAccountsConfigured()) return null;
  await ensureSchema();
  const [row] = await db()<AccountRow[]>`select a.* from sessions s join accounts a on a.id = s.account_id
    where s.token_hash = ${hash(token)} and s.expires_at > now()`;
  return row ? toAccount(row) : null;
}

export async function endSession(token: string): Promise<void> {
  await ensureSchema();
  await db()`delete from sessions where token_hash = ${hash(token)}`;
}

export interface AccountPatch {
  alertEmail?: boolean;
  alertSms?: boolean;
  alertFrequency?: 'quotidien' | 'hebdo';
  savedSearch?: SavedSearch;
  profile?: unknown;
  tracker?: unknown;
}

export async function updateAccount(id: string, patch: AccountPatch): Promise<Account> {
  const s = db();
  const [row] = await s<AccountRow[]>`update accounts set
      alert_email = coalesce(${patch.alertEmail ?? null}, alert_email),
      alert_sms = coalesce(${patch.alertSms ?? null}, alert_sms),
      alert_frequency = coalesce(${patch.alertFrequency ?? null}, alert_frequency),
      saved_search = coalesce(${patch.savedSearch ? s.json(patch.savedSearch) : null}, saved_search),
      profile = coalesce(${patch.profile !== undefined ? s.json(patch.profile as never) : null}, profile),
      tracker = coalesce(${patch.tracker !== undefined ? s.json(patch.tracker as never) : null}, tracker),
      updated_at = now()
    where id = ${id} returning *`;
  return toAccount(row!);
}

export async function setVerifiedPhone(id: string, phone: string): Promise<void> {
  await db()`update accounts set phone = ${phone}, phone_verified = true, updated_at = now() where id = ${id}`;
}

export async function removePhone(id: string): Promise<void> {
  await db()`update accounts set phone = null, phone_verified = false, alert_sms = false, updated_at = now() where id = ${id}`;
}

/** Supprime le compte et tout ce qui y est rattaché. */
export async function deleteAccount(id: string): Promise<void> {
  await db()`delete from accounts where id = ${id}`;
}

/** Les comptes à prévenir maintenant, selon leur fréquence. */
export async function accountsDueForAlert(): Promise<(Account & { lastAlertAt: Date | null })[]> {
  await ensureSchema();
  const rows = await db()<AccountRow[]>`select * from accounts
    where (alert_email or (alert_sms and phone_verified))
      and saved_search <> '{}'::jsonb
      and (last_alert_at is null
        or (alert_frequency = 'quotidien' and last_alert_at < now() - interval '20 hours')
        or (alert_frequency = 'hebdo' and last_alert_at < now() - interval '6 days 12 hours'))`;
  return rows.map((r) => ({ ...toAccount(r), lastAlertAt: r.last_alert_at }));
}

export async function markAlerted(id: string): Promise<void> {
  await db()`update accounts set last_alert_at = now() where id = ${id}`;
}
