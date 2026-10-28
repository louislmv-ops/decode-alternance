// La communauté : des membres (un compte + un pseudo), des messages courts, des réponses,
// des « j'aime », des abonnements entre membres et des signalements.

import { z } from 'zod/v4';
import { ensureSchema as ensureAccounts } from '@/lib/account/store';
import { db } from '@/lib/offers/store';
import { FEED_PAGE, REPORTS_TO_HIDE, type Member, type Post, type PostKind } from './shared';

export { KIND_LABELS, KINDS, POST_MAX, type Member, type Post, type PostKind } from './shared';
export { ensureSchema as ensureCommunitySchema };

export const MemberInput = z.object({
  handle: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_]{3,20}$/, 'Pseudo : 3 à 20 lettres, chiffres ou _'),
  name: z.string().trim().min(1).max(40),
  bio: z.string().trim().max(160).default(''),
  domain: z.string().trim().max(40).default(''),
  city: z.string().trim().max(40).default(''),
  school: z.string().trim().max(60).default(''),
  formation: z.string().trim().max(80).default(''),
  level: z.number().int().min(3).max(7).nullable().default(null),
  rhythm: z.string().trim().max(60).default(''),
  startMonth: z.string().regex(/^\d{4}-\d{2}$/).nullable().default(null),
  seeking: z.boolean().default(false),
  visibleToCompanies: z.boolean().default(false),
  /** Les entreprises dont j'ai aimé une offre peuvent voir mon profil (accord à part, décoché par défaut). */
  shareLikes: z.boolean().default(false),
  skills: z.array(z.string().trim().min(1).max(30)).max(8).default([]),
  linkedin: z
    .string()
    .trim()
    .max(200)
    .refine((v) => v === '' || /^https:\/\/([a-z]{2,3}\.)?linkedin\.com\/in\/[^\s/]+\/?$/i.test(v), 'Lien LinkedIn de profil attendu (https://www.linkedin.com/in/...)')
    .default(''),
});
export type MemberInput = z.infer<typeof MemberInput>;


let ready: Promise<void> | null = null;

function ensureSchema(): Promise<void> {
  ready ??= (async () => {
    await ensureAccounts();
    const s = db();
    await s`create table if not exists members (
      account_id uuid primary key references accounts(id) on delete cascade,
      handle text unique not null,
      name text not null,
      bio text not null default '',
      domain text not null default '',
      city text not null default '',
      school text not null default '',
      banned boolean not null default false,
      created_at timestamptz not null default now()
    )`;
    // La carte alternant, ajoutée après coup : chaque colonne est créée si elle manque.
    await s`alter table members
      add column if not exists formation text not null default '',
      add column if not exists level int,
      add column if not exists rhythm text not null default '',
      add column if not exists start_month text,
      add column if not exists seeking boolean not null default false,
      add column if not exists visible_to_companies boolean not null default false,
      add column if not exists skills text[] not null default '{}',
      add column if not exists linkedin text not null default '',
      add column if not exists share_likes boolean not null default false`;
    await s`create table if not exists posts (
      id uuid primary key default gen_random_uuid(),
      author_id uuid not null references members(account_id) on delete cascade,
      parent_id uuid references posts(id) on delete cascade,
      kind text not null default 'libre',
      body text not null,
      hidden boolean not null default false,
      created_at timestamptz not null default now()
    )`;
    await s`create index if not exists posts_feed on posts (created_at desc) where parent_id is null and not hidden`;
    await s`create index if not exists posts_parent on posts (parent_id, created_at)`;
    await s`create table if not exists likes (
      post_id uuid not null references posts(id) on delete cascade,
      account_id uuid not null references members(account_id) on delete cascade,
      primary key (post_id, account_id)
    )`;
    await s`create table if not exists follows (
      follower_id uuid not null references members(account_id) on delete cascade,
      followee_id uuid not null references members(account_id) on delete cascade,
      created_at timestamptz not null default now(),
      primary key (follower_id, followee_id),
      check (follower_id <> followee_id)
    )`;
    await s`create table if not exists reports (
      post_id uuid not null references posts(id) on delete cascade,
      reporter_id uuid not null references members(account_id) on delete cascade,
      reason text not null default '',
      created_at timestamptz not null default now(),
      primary key (post_id, reporter_id)
    )`;
  })().catch((error) => {
    ready = null;
    throw error;
  });
  return ready;
}

interface MemberRow {
  account_id: string;
  handle: string;
  name: string;
  bio: string;
  domain: string;
  city: string;
  school: string;
  banned: boolean;
  formation: string;
  level: number | null;
  rhythm: string;
  start_month: string | null;
  seeking: boolean;
  visible_to_companies: boolean;
  share_likes?: boolean;
  skills: string[];
  linkedin: string;
  followers: number;
  following: number;
  posts: number;
}

function toMember(r: MemberRow): Member {
  return {
    accountId: r.account_id,
    handle: r.handle,
    name: r.name,
    bio: r.bio,
    domain: r.domain,
    city: r.city,
    school: r.school,
    followers: r.followers,
    following: r.following,
    posts: r.posts,
    formation: r.formation,
    level: r.level,
    rhythm: r.rhythm,
    startMonth: r.start_month,
    seeking: r.seeking,
    visibleToCompanies: r.visible_to_companies,
    shareLikes: r.share_likes ?? false,
    skills: r.skills ?? [],
    linkedin: r.linkedin,
  };
}

const memberColumns = (s: ReturnType<typeof db>) => s`m.*,
  (select count(*)::int from follows f where f.followee_id = m.account_id) as followers,
  (select count(*)::int from follows f where f.follower_id = m.account_id) as following,
  (select count(*)::int from posts p where p.author_id = m.account_id and not p.hidden) as posts`;

export async function memberByAccount(accountId: string): Promise<(Member & { banned: boolean }) | null> {
  await ensureSchema();
  const s = db();
  const [row] = await s<MemberRow[]>`select ${memberColumns(s)} from members m where m.account_id = ${accountId}`;
  return row ? { ...toMember(row), banned: row.banned } : null;
}

export async function memberByHandle(handle: string): Promise<Member | null> {
  await ensureSchema();
  const s = db();
  const [row] = await s<MemberRow[]>`select ${memberColumns(s)} from members m where m.handle = ${handle.toLowerCase()} and not m.banned`;
  return row ? toMember(row) : null;
}

export class HandleTaken extends Error {}

export async function saveMember(accountId: string, input: MemberInput): Promise<Member> {
  await ensureSchema();
  const s = db();
  try {
    // Partager ses likes n'a de sens que pour un profil visible des entreprises.
    const shareLikes = input.seeking && input.visibleToCompanies && input.shareLikes;
    await s`insert into members (account_id, handle, name, bio, domain, city, school, formation, level, rhythm, start_month, seeking, visible_to_companies, skills, linkedin, share_likes)
      values (${accountId}, ${input.handle}, ${input.name}, ${input.bio}, ${input.domain}, ${input.city}, ${input.school},
        ${input.formation}, ${input.level}, ${input.rhythm}, ${input.startMonth}, ${input.seeking}, ${input.visibleToCompanies},
        ${input.skills}, ${input.linkedin}, ${shareLikes})
      on conflict (account_id) do update set handle = excluded.handle, name = excluded.name, bio = excluded.bio,
        domain = excluded.domain, city = excluded.city, school = excluded.school, formation = excluded.formation,
        level = excluded.level, rhythm = excluded.rhythm, start_month = excluded.start_month, seeking = excluded.seeking,
        visible_to_companies = excluded.visible_to_companies, skills = excluded.skills, linkedin = excluded.linkedin,
        share_likes = excluded.share_likes`;
  } catch (error) {
    if ((error as { code?: string }).code === '23505') throw new HandleTaken();
    throw error;
  }
  return (await memberByAccount(accountId))!;
}

interface PostRow {
  id: string;
  kind: PostKind;
  body: string;
  created_at: Date;
  parent_id: string | null;
  author_id: string;
  handle: string;
  name: string;
  domain: string;
  city: string;
  likes: number;
  replies: number;
  liked: boolean;
}

function toPost(r: PostRow, viewer: string | null): Post {
  return {
    id: r.id,
    kind: r.kind,
    body: r.body,
    createdAt: r.created_at.toISOString(),
    parentId: r.parent_id,
    author: { handle: r.handle, name: r.name, domain: r.domain, city: r.city },
    likes: r.likes,
    replies: r.replies,
    likedByMe: r.liked,
    mine: viewer !== null && viewer === r.author_id,
  };
}

const NOBODY = '00000000-0000-0000-0000-000000000000';

function postSelect(s: ReturnType<typeof db>, viewer: string | null) {
  return s`select p.id, p.kind, p.body, p.created_at, p.parent_id, p.author_id, m.handle, m.name, m.domain, m.city,
    (select count(*)::int from likes l where l.post_id = p.id) as likes,
    (select count(*)::int from posts r where r.parent_id = p.id and not r.hidden) as replies,
    exists(select 1 from likes l where l.post_id = p.id and l.account_id = ${viewer ?? NOBODY}) as liked
    from posts p join members m on m.account_id = p.author_id`;
}

export interface FeedQuery {
  viewer: string | null;
  scope: 'tout' | 'abonnements';
  kind?: PostKind;
  author?: string;
  before?: string;
}

/** Le fil : les messages (pas les réponses), du plus récent au plus ancien, par pages de 30. */
export async function feed(q: FeedQuery): Promise<Post[]> {
  await ensureSchema();
  const s = db();
  const conditions = [s`p.parent_id is null`, s`not p.hidden`, s`not m.banned`];
  if (q.kind) conditions.push(s`p.kind = ${q.kind}`);
  if (q.author) conditions.push(s`m.handle = ${q.author}`);
  if (q.before) conditions.push(s`p.created_at < ${new Date(q.before)}`);
  if (q.scope === 'abonnements' && q.viewer) {
    conditions.push(s`(p.author_id = ${q.viewer} or p.author_id in (select followee_id from follows where follower_id = ${q.viewer}))`);
  }
  const where = conditions.reduce((acc, c) => s`${acc} and ${c}`);
  const rows = await s<PostRow[]>`${postSelect(s, q.viewer)} where ${where} order by p.created_at desc limit ${FEED_PAGE}`;
  return rows.map((r) => toPost(r, q.viewer));
}

/** Un message et ses réponses, dans l'ordre. */
export async function thread(id: string, viewer: string | null): Promise<{ post: Post; replies: Post[] } | null> {
  await ensureSchema();
  const s = db();
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const [root] = await s<PostRow[]>`${postSelect(s, viewer)} where p.id = ${id} and not p.hidden and not m.banned`;
  if (!root) return null;
  const replies = await s<PostRow[]>`${postSelect(s, viewer)} where p.parent_id = ${id} and not p.hidden and not m.banned order by p.created_at asc limit 200`;
  return { post: toPost(root, viewer), replies: replies.map((r) => toPost(r, viewer)) };
}

export async function createPost(authorId: string, input: { body: string; kind: PostKind; parentId?: string | null }): Promise<string> {
  await ensureSchema();
  const s = db();
  if (input.parentId) {
    const [parent] = await s<{ id: string }[]>`select id from posts where id = ${input.parentId} and parent_id is null and not hidden`;
    if (!parent) throw new Error('Message introuvable');
  }
  const [row] = await s<{ id: string }[]>`insert into posts (author_id, parent_id, kind, body)
    values (${authorId}, ${input.parentId ?? null}, ${input.parentId ? 'libre' : input.kind}, ${input.body}) returning id`;
  return row!.id;
}

/** Supprime un message : son auteur ou un modérateur. */
export async function deletePost(id: string, accountId: string, isAdmin: boolean): Promise<boolean> {
  await ensureSchema();
  const s = db();
  const result = isAdmin ? await s`delete from posts where id = ${id}` : await s`delete from posts where id = ${id} and author_id = ${accountId}`;
  return result.count > 0;
}

export async function setLike(postId: string, accountId: string, on: boolean): Promise<void> {
  await ensureSchema();
  const s = db();
  if (on) await s`insert into likes (post_id, account_id) values (${postId}, ${accountId}) on conflict do nothing`;
  else await s`delete from likes where post_id = ${postId} and account_id = ${accountId}`;
}

export async function setFollow(followerId: string, handle: string, on: boolean): Promise<void> {
  await ensureSchema();
  const s = db();
  const target = await memberByHandle(handle);
  if (!target || target.accountId === followerId) return;
  if (on) await s`insert into follows (follower_id, followee_id) values (${followerId}, ${target.accountId}) on conflict do nothing`;
  else await s`delete from follows where follower_id = ${followerId} and followee_id = ${target.accountId}`;
}

export async function isFollowing(followerId: string, followeeId: string): Promise<boolean> {
  await ensureSchema();
  const [row] = await db()<{ x: boolean }[]>`select exists(select 1 from follows where follower_id = ${followerId} and followee_id = ${followeeId}) as x`;
  return row?.x ?? false;
}

/** Signale un message ; au troisième signalement, il est masqué en attendant la modération. */
export async function reportPost(postId: string, reporterId: string, reason: string): Promise<void> {
  await ensureSchema();
  const s = db();
  await s`insert into reports (post_id, reporter_id, reason) values (${postId}, ${reporterId}, ${reason}) on conflict do nothing`;
  await s`update posts set hidden = true where id = ${postId}
    and (select count(*) from reports where post_id = ${postId}) >= ${REPORTS_TO_HIDE}`;
}

/** Des membres à suivre : même domaine ou même ville d'abord, jamais ceux déjà suivis. */
export async function suggestions(accountId: string, limit = 5): Promise<Member[]> {
  await ensureSchema();
  const s = db();
  const me = await memberByAccount(accountId);
  if (!me) return [];
  const rows = await s<MemberRow[]>`select ${memberColumns(s)} from members m
    where m.account_id <> ${accountId} and not m.banned
      and m.account_id not in (select followee_id from follows where follower_id = ${accountId})
    order by (m.domain <> '' and lower(m.domain) = lower(${me.domain}))::int + (m.city <> '' and lower(m.city) = lower(${me.city}))::int desc,
      m.created_at desc
    limit ${limit}`;
  return rows.map(toMember);
}

/** Pour la modération : les messages signalés, même masqués. */
export async function reportedPosts(): Promise<{ id: string; body: string; handle: string; reports: number; hidden: boolean; reasons: string[] }[]> {
  await ensureSchema();
  return db()<{ id: string; body: string; handle: string; reports: number; hidden: boolean; reasons: string[] }[]>`
    select p.id, p.body, m.handle, p.hidden, count(r.*)::int as reports, array_agg(r.reason) as reasons
    from posts p join members m on m.account_id = p.author_id join reports r on r.post_id = p.id
    group by p.id, m.handle order by count(r.*) desc, p.created_at desc limit 100`;
}

export async function moderate(postId: string, action: 'garder' | 'masquer'): Promise<void> {
  await ensureSchema();
  const s = db();
  if (action === 'garder') {
    await s`update posts set hidden = false where id = ${postId}`;
    await s`delete from reports where post_id = ${postId}`;
  } else {
    await s`update posts set hidden = true where id = ${postId}`;
  }
}

export async function banMember(handle: string): Promise<void> {
  await ensureSchema();
  await db()`update members set banned = true where handle = ${handle.toLowerCase()}`;
}
