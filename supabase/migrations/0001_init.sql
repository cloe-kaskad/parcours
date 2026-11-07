-- parcours.amarecherche.fr : schéma initial
-- À exécuter dans Supabase > SQL Editor (ou via `supabase db push`).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------
create type public.role_type as enum ('cliente', 'coach', 'relecteur');
create type public.parcours_statut as enum ('actif', 'pause', 'termine');
create type public.etape_statut as enum ('a_venir', 'en_cours', 'traversee');
create type public.seance_statut as enum ('planifiee', 'faite', 'annulee');
create type public.transcript_statut as enum ('aucun', 'en_cours', 'pret', 'erreur');
create type public.ressource_type as enum ('podcast', 'video', 'lecture', 'film', 'pdf', 'autre');
create type public.suivi_statut as enum ('a_voir', 'commence', 'termine');

-- ---------------------------------------------------------------------
-- Fonctions utilitaires
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------------
-- Programmes (B&I aujourd'hui, Présente ! demain)
-- ---------------------------------------------------------------------
create table public.programmes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  nom text not null,
  created_at timestamptz not null default now()
);

insert into public.programmes (slug, nom) values ('bi', 'Blocages & Intuition');

-- ---------------------------------------------------------------------
-- Profils (miroir de auth.users)
-- ---------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  prenom text not null default '',
  nom text not null default '',
  role public.role_type not null default 'cliente',
  programme_id uuid references public.programmes (id),
  actif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Création automatique du profil à l'inscription d'un utilisateur.
-- Le rôle et le prénom peuvent être passés dans les métadonnées (raw_user_meta_data).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  r public.role_type := 'cliente';
begin
  if new.raw_user_meta_data ? 'role'
     and new.raw_user_meta_data ->> 'role' in ('cliente', 'coach', 'relecteur') then
    r := (new.raw_user_meta_data ->> 'role')::public.role_type;
  end if;
  insert into public.profiles (id, email, prenom, nom, role, programme_id)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'prenom', ''),
    coalesce(new.raw_user_meta_data ->> 'nom', ''),
    r,
    (select id from public.programmes where slug = 'bi')
  )
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Rôle de l'utilisatrice connectée (utilisé par les politiques RLS).
create or replace function public.mon_role()
returns public.role_type language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.est_equipe()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role in ('coach', 'relecteur') from public.profiles where id = auth.uid()), false)
$$;

-- ---------------------------------------------------------------------
-- Parcours et étapes (le chemin)
-- ---------------------------------------------------------------------
create table public.parcours (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.profiles (id) on delete cascade,
  programme_id uuid not null references public.programmes (id),
  intention text not null default '',
  mots_cles text[] not null default '{}',
  date_debut date,
  statut public.parcours_statut not null default 'actif',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index parcours_cliente_idx on public.parcours (cliente_id);
create trigger parcours_updated_at before update on public.parcours
  for each row execute function public.set_updated_at();

create table public.etapes (
  id uuid primary key default gen_random_uuid(),
  parcours_id uuid not null references public.parcours (id) on delete cascade,
  ordre int not null,
  titre text not null,
  mots_cles text[] not null default '{}',
  moments_forts text not null default '',
  statut public.etape_statut not null default 'a_venir',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (parcours_id, ordre)
);
create trigger etapes_updated_at before update on public.etapes
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Séances, transcripts, retours d'Émilien
-- ---------------------------------------------------------------------
create table public.seances (
  id uuid primary key default gen_random_uuid(),
  parcours_id uuid not null references public.parcours (id) on delete cascade,
  numero int not null,
  date timestamptz,
  duree_min int not null default 90,
  etape_id uuid references public.etapes (id) on delete set null,
  statut public.seance_statut not null default 'planifiee',
  audio_path text,
  transcript_formate text,
  transcript_pdf_path text,
  transcript_statut public.transcript_statut not null default 'aucun',
  transcript_erreur text,
  envoye_emilien_at timestamptz,
  calendar_event_id text,
  mots_cles_proposes text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (parcours_id, numero)
);
create index seances_parcours_idx on public.seances (parcours_id);
create index seances_date_idx on public.seances (date);
create trigger seances_updated_at before update on public.seances
  for each row execute function public.set_updated_at();

-- Le transcript brut (sortie de la transcription automatique) est dans une table à part :
-- il n'est jamais lisible par les clientes.
create table public.transcripts_bruts (
  seance_id uuid primary key references public.seances (id) on delete cascade,
  texte text not null,
  segments jsonb,
  created_at timestamptz not null default now()
);

-- Retours d'Émilien sur une séance (invisibles pour la cliente).
create table public.retours (
  id uuid primary key default gen_random_uuid(),
  seance_id uuid not null references public.seances (id) on delete cascade,
  auteur_id uuid not null references public.profiles (id),
  contenu text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index retours_seance_idx on public.retours (seance_id);
create trigger retours_updated_at before update on public.retours
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Pratiques (une série = une lettre rattachée à une séance)
-- ---------------------------------------------------------------------
create table public.pratiques_series (
  id uuid primary key default gen_random_uuid(),
  parcours_id uuid not null references public.parcours (id) on delete cascade,
  seance_id uuid references public.seances (id) on delete set null,
  titre text not null default '',
  intro text not null default '',
  signature text not null default 'Cloé',
  publiee_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index pratiques_series_parcours_idx on public.pratiques_series (parcours_id);
create index pratiques_series_seance_idx on public.pratiques_series (seance_id);
create trigger pratiques_series_updated_at before update on public.pratiques_series
  for each row execute function public.set_updated_at();

create table public.pratiques (
  id uuid primary key default gen_random_uuid(),
  serie_id uuid not null references public.pratiques_series (id) on delete cascade,
  ordre int not null,
  titre text not null,
  accroche text not null default '',
  consigne text not null default '',
  regles text not null default '',
  pourquoi text not null default '',
  bonus boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (serie_id, ordre)
);
create trigger pratiques_updated_at before update on public.pratiques
  for each row execute function public.set_updated_at();

create table public.reponses (
  id uuid primary key default gen_random_uuid(),
  pratique_id uuid not null references public.pratiques (id) on delete cascade,
  cliente_id uuid not null references public.profiles (id) on delete cascade,
  contenu text not null default '',
  photos text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (pratique_id, cliente_id)
);
create trigger reponses_updated_at before update on public.reponses
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Ressources (bibliothèque partagée, affectée à des parcours)
-- ---------------------------------------------------------------------
create table public.ressources (
  id uuid primary key default gen_random_uuid(),
  type public.ressource_type not null default 'autre',
  titre text not null,
  auteur text not null default '',
  url text,
  fichier_path text,
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger ressources_updated_at before update on public.ressources
  for each row execute function public.set_updated_at();

create table public.ressources_affectations (
  id uuid primary key default gen_random_uuid(),
  ressource_id uuid not null references public.ressources (id) on delete cascade,
  parcours_id uuid not null references public.parcours (id) on delete cascade,
  seance_id uuid references public.seances (id) on delete set null,
  pourquoi text not null default '',
  publiee_at timestamptz,
  created_at timestamptz not null default now(),
  unique (ressource_id, parcours_id)
);
create index ressources_affectations_parcours_idx on public.ressources_affectations (parcours_id);

create table public.ressources_suivi (
  id uuid primary key default gen_random_uuid(),
  affectation_id uuid not null references public.ressources_affectations (id) on delete cascade,
  cliente_id uuid not null references public.profiles (id) on delete cascade,
  statut public.suivi_statut not null default 'a_voir',
  position_sec int,
  updated_at timestamptz not null default now(),
  unique (affectation_id, cliente_id)
);
create trigger ressources_suivi_updated_at before update on public.ressources_suivi
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Journal, météo, feedbacks
-- ---------------------------------------------------------------------
create table public.journal (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.profiles (id) on delete cascade,
  date date not null default current_date,
  contenu text not null default '',
  pour_prochaine_seance boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index journal_cliente_date_idx on public.journal (cliente_id, date desc);
create trigger journal_updated_at before update on public.journal
  for each row execute function public.set_updated_at();

create table public.meteo_etats (
  code text primary key,
  libelle text not null,
  ordre int not null,
  actif boolean not null default true
);

create table public.musiques (
  id uuid primary key default gen_random_uuid(),
  etat_code text not null references public.meteo_etats (code) on delete cascade,
  titre text not null,
  artiste text not null default '',
  url text not null,
  ordre int not null default 0
);

create table public.meteo (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.profiles (id) on delete cascade,
  date date not null default current_date,
  etat_code text not null references public.meteo_etats (code),
  note text not null default '',
  created_at timestamptz not null default now(),
  unique (cliente_id, date)
);

create table public.feedbacks (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.profiles (id) on delete cascade,
  cycle int not null default 1,
  reponses jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table public.programmes enable row level security;
alter table public.profiles enable row level security;
alter table public.parcours enable row level security;
alter table public.etapes enable row level security;
alter table public.seances enable row level security;
alter table public.transcripts_bruts enable row level security;
alter table public.retours enable row level security;
alter table public.pratiques_series enable row level security;
alter table public.pratiques enable row level security;
alter table public.reponses enable row level security;
alter table public.ressources enable row level security;
alter table public.ressources_affectations enable row level security;
alter table public.ressources_suivi enable row level security;
alter table public.journal enable row level security;
alter table public.meteo_etats enable row level security;
alter table public.musiques enable row level security;
alter table public.meteo enable row level security;
alter table public.feedbacks enable row level security;

-- Une cliente est propriétaire d'un parcours
create or replace function public.mon_parcours(p uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.parcours where id = p and cliente_id = auth.uid())
$$;

-- programmes : lecture pour toutes, écriture équipe
create policy "programmes lecture" on public.programmes for select to authenticated using (true);
create policy "programmes equipe" on public.programmes for all to authenticated
  using (public.est_equipe()) with check (public.est_equipe());

-- profiles : chacune voit le sien, l'équipe voit tout
create policy "profiles lecture" on public.profiles for select to authenticated
  using (id = auth.uid() or public.est_equipe());
create policy "profiles maj propre" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid() and role = public.mon_role());
create policy "profiles equipe" on public.profiles for all to authenticated
  using (public.est_equipe()) with check (public.est_equipe());

-- parcours et étapes
create policy "parcours lecture" on public.parcours for select to authenticated
  using (cliente_id = auth.uid() or public.est_equipe());
create policy "parcours equipe" on public.parcours for all to authenticated
  using (public.est_equipe()) with check (public.est_equipe());

create policy "etapes lecture" on public.etapes for select to authenticated
  using (public.mon_parcours(parcours_id) or public.est_equipe());
create policy "etapes equipe" on public.etapes for all to authenticated
  using (public.est_equipe()) with check (public.est_equipe());

-- séances : la cliente voit les siennes (sans le brut), l'équipe gère
create policy "seances lecture" on public.seances for select to authenticated
  using (public.mon_parcours(parcours_id) or public.est_equipe());
create policy "seances equipe" on public.seances for all to authenticated
  using (public.est_equipe()) with check (public.est_equipe());

create policy "transcripts bruts equipe" on public.transcripts_bruts for all to authenticated
  using (public.est_equipe()) with check (public.est_equipe());

create policy "retours equipe" on public.retours for all to authenticated
  using (public.est_equipe()) with check (public.est_equipe());

-- pratiques : la cliente voit les séries publiées de son parcours
create policy "series lecture cliente" on public.pratiques_series for select to authenticated
  using ((public.mon_parcours(parcours_id) and publiee_at is not null) or public.est_equipe());
create policy "series equipe" on public.pratiques_series for all to authenticated
  using (public.est_equipe()) with check (public.est_equipe());

create policy "pratiques lecture cliente" on public.pratiques for select to authenticated
  using (
    public.est_equipe() or exists (
      select 1 from public.pratiques_series s
      where s.id = serie_id and s.publiee_at is not null and public.mon_parcours(s.parcours_id)
    )
  );
create policy "pratiques equipe" on public.pratiques for all to authenticated
  using (public.est_equipe()) with check (public.est_equipe());

create policy "reponses cliente" on public.reponses for all to authenticated
  using (cliente_id = auth.uid()) with check (cliente_id = auth.uid());
create policy "reponses equipe lecture" on public.reponses for select to authenticated
  using (public.est_equipe());

-- ressources
create policy "ressources lecture" on public.ressources for select to authenticated
  using (
    public.est_equipe() or exists (
      select 1 from public.ressources_affectations a
      where a.ressource_id = id and a.publiee_at is not null and public.mon_parcours(a.parcours_id)
    )
  );
create policy "ressources equipe" on public.ressources for all to authenticated
  using (public.est_equipe()) with check (public.est_equipe());

create policy "affectations lecture" on public.ressources_affectations for select to authenticated
  using ((public.mon_parcours(parcours_id) and publiee_at is not null) or public.est_equipe());
create policy "affectations equipe" on public.ressources_affectations for all to authenticated
  using (public.est_equipe()) with check (public.est_equipe());

create policy "suivi cliente" on public.ressources_suivi for all to authenticated
  using (cliente_id = auth.uid()) with check (cliente_id = auth.uid());
create policy "suivi equipe lecture" on public.ressources_suivi for select to authenticated
  using (public.est_equipe());

-- journal, météo, feedbacks
create policy "journal cliente" on public.journal for all to authenticated
  using (cliente_id = auth.uid()) with check (cliente_id = auth.uid());
create policy "journal equipe lecture" on public.journal for select to authenticated
  using (public.est_equipe());

create policy "meteo etats lecture" on public.meteo_etats for select to authenticated using (true);
create policy "meteo etats equipe" on public.meteo_etats for all to authenticated
  using (public.est_equipe()) with check (public.est_equipe());

create policy "musiques lecture" on public.musiques for select to authenticated using (true);
create policy "musiques equipe" on public.musiques for all to authenticated
  using (public.est_equipe()) with check (public.est_equipe());

create policy "meteo cliente" on public.meteo for all to authenticated
  using (cliente_id = auth.uid()) with check (cliente_id = auth.uid());
create policy "meteo equipe lecture" on public.meteo for select to authenticated
  using (public.est_equipe());

create policy "feedbacks cliente" on public.feedbacks for all to authenticated
  using (cliente_id = auth.uid()) with check (cliente_id = auth.uid());
create policy "feedbacks equipe" on public.feedbacks for all to authenticated
  using (public.est_equipe()) with check (public.est_equipe());

-- ---------------------------------------------------------------------
-- Stockage : buckets privés, accès par URLs signées générées côté serveur
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values
  ('audio', 'audio', false, 524288000),
  ('transcripts', 'transcripts', false, 52428800),
  ('photos', 'photos', false, 20971520),
  ('ressources', 'ressources', false, 104857600)
on conflict (id) do nothing;

create policy "storage equipe" on storage.objects for all to authenticated
  using (public.est_equipe()) with check (public.est_equipe());
