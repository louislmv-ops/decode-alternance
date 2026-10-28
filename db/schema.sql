-- Base des offres. À lancer une fois sur une base Postgres (Supabase, Neon, Vercel Postgres…) :
--   psql "$DATABASE_URL" -f db/schema.sql

create table if not exists offers (
  id text primary key,
  source text not null check (source in ('site-carriere', 'france-travail', 'la-bonne-alternance', 'adzuna', 'jooble')),
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
  -- Haut de la fourchette annoncée : seulement pour afficher « de … à … ».
  salary_max_cents integer,
  start_date date,
  published_at timestamptz not null,
  description text not null,
  direct boolean not null default false,
  fingerprint text not null,
  school_flags text[] not null default '{}',
  -- Code ROME du métier : sert au filtre par secteur.
  rome_code text,
  -- Candidature simplifiée possible (La bonne alternance).
  easy_apply boolean not null default false,
  -- Dernière fois que la collecte a vu l'offre : une offre qui n'est plus vue est retirée.
  seen_at timestamptz not null default now(),
  unique (source, source_id)
);

-- Bases créées avant l'ajout du code ROME.
alter table offers add column if not exists rome_code text;
alter table offers add column if not exists easy_apply boolean not null default false;
alter table offers add column if not exists salary_max_cents integer;
-- Télétravail et compétences lus dans l'annonce (lib/offers/details.ts), remplis à chaque collecte.
alter table offers add column if not exists remote text check (remote in ('aucun', 'partiel', 'total'));
alter table offers add column if not exists skills text[] not null default '{}';
-- Logo, site et SIREN de l'employeur quand la source les donne (France Travail, La bonne alternance, sites carrière).
alter table offers add column if not exists logo_url text;
alter table offers add column if not exists company_site text;
alter table offers add column if not exists company_siren text;

-- Minuscules sans accents : « developpeur » trouve « Développeur ». Une fonction simple et immuable,
-- sans extension, pour pouvoir l'indexer. Les deux chaînes ont la même longueur (une lettre pour une lettre).
create or replace function decode_fold(t text) returns text
language sql immutable parallel safe strict
as $$ select translate(lower(t), 'àâäáãåçéèêëíìîïñóòôöõúùûüýÿœæ', 'aaaaaaceeeeiiiinooooouuuuyyoa') $$;

create index if not exists offers_fingerprint on offers (fingerprint);
create index if not exists offers_department on offers (department);
create index if not exists offers_published on offers (published_at desc);
-- Remplacé par offers_search_folded, qui ignore les accents.
drop index if exists offers_search;
create index if not exists offers_search_folded on offers
  using gin (to_tsvector('french', decode_fold(title || ' ' || coalesce(company, '') || ' ' || coalesce(city, ''))));
create index if not exists offers_skills on offers using gin (skills);

-- Les tableaux d'offres des logiciels de recrutement (Greenhouse, Lever…) trouvés pour chaque employeur.
create table if not exists ats_boards (
  provider text not null,
  slug text not null,
  company text not null,
  company_size text check (company_size in ('tpe', 'pme', 'eti', 'grande')),
  found_at timestamptz not null default now(),
  checked_at timestamptz,
  offers integer not null default 0,
  -- Échecs d'affilée : au cinquième, le tableau n'est plus lu.
  failures smallint not null default 0,
  primary key (provider, slug)
);

-- Les employeurs déjà cherchés chez ces logiciels, pour ne pas les rechercher chaque nuit.
create table if not exists ats_probes (
  company_key text primary key,
  company text not null,
  probed_at timestamptz not null default now(),
  found boolean not null default false
);

-- Traductions déjà faites, pour ne payer l'IA qu'une fois par offre.
create table if not exists offer_decodes (
  offer_id text primary key references offers (id) on delete cascade,
  decoded jsonb not null,
  model text not null,
  created_at timestamptz not null default now()
);

-- Une offre publiée sur plusieurs sites n'apparaît qu'une fois : on garde la source la plus directe.
-- Recréée à chaque fois : la liste des colonnes de « o.* » suit celle de la table.
drop view if exists offers_unique;
create view offers_unique as
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
