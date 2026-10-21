-- Base des offres. À lancer une fois sur une base Postgres (Supabase, Neon, Vercel Postgres…) :
--   psql "$DATABASE_URL" -f db/schema.sql

create table if not exists offers (
  id text primary key,
  source text not null check (source in ('site-carriere', 'france-travail', 'la-bonne-alternance')),
  source_id text not null,
  source_url text not null,
  title text not null,
  company text,
  company_size text check (company_size in ('tpe', 'pme', 'eti', 'grande')),
  city text,
  postal_code text,
  department text,
  contract text not null check (contract in ('apprentissage', 'professionnalisation', 'alternance')),
  diploma_level smallint check (diploma_level between 3 and 7),
  salary_text text,
  salary_monthly_cents integer,
  start_date date,
  published_at timestamptz not null,
  description text not null,
  direct boolean not null default false,
  fingerprint text not null,
  school_flags text[] not null default '{}',
  -- Dernière fois que la collecte a vu l'offre : une offre qui n'est plus vue est retirée.
  seen_at timestamptz not null default now(),
  unique (source, source_id)
);

create index if not exists offers_fingerprint on offers (fingerprint);
create index if not exists offers_department on offers (department);
create index if not exists offers_published on offers (published_at desc);
create index if not exists offers_search on offers
  using gin (to_tsvector('french', title || ' ' || coalesce(company, '') || ' ' || coalesce(city, '')));

-- Traductions déjà faites, pour ne payer l'IA qu'une fois par offre.
create table if not exists offer_decodes (
  offer_id text primary key references offers (id) on delete cascade,
  decoded jsonb not null,
  model text not null,
  created_at timestamptz not null default now()
);

-- Une offre publiée sur plusieurs sites n'apparaît qu'une fois : on garde la source la plus directe.
create or replace view offers_unique as
select distinct on (fingerprint)
  o.*,
  array(
    select distinct other.source from offers other
    where other.fingerprint = o.fingerprint and other.id <> o.id
  ) as also_on
from offers o
order by
  fingerprint,
  case source when 'site-carriere' then 0 when 'france-travail' then 1 else 2 end,
  published_at desc;
