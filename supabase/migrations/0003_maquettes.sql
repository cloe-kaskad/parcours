-- 0003_maquettes.sql : le schéma des maquettes (docs/03-brief-construction.md, section 3).
-- À coller en une fois dans Supabase > SQL Editor. Tout passe, ou rien ne change.
begin;

-- ---------------------------------------------------------------------
-- Fin de 0002, restée non appliquée en production
-- ---------------------------------------------------------------------
alter table public.meteo add column if not exists updated_at timestamptz not null default now();
drop trigger if exists meteo_updated_at on public.meteo;
create trigger meteo_updated_at before update on public.meteo
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Correction de 0001 : dans la sous-requête, « id » désignait a.id et non
-- ressources.id, si bien qu'une cliente ne pouvait lire aucune ressource.
-- ---------------------------------------------------------------------
drop policy "ressources lecture" on public.ressources;
create policy "ressources lecture" on public.ressources for select to authenticated
  using (
    public.est_equipe() or exists (
      select 1 from public.ressources_affectations a
      where a.ressource_id = ressources.id and a.publiee_at is not null and public.mon_parcours(a.parcours_id)
    )
  );

-- ---------------------------------------------------------------------
-- Parcours : couverture et dossier Drive
-- ---------------------------------------------------------------------
alter table public.parcours
  add column couverture_path text,
  add column drive_folder_id text,
  add column drive_folder_nom text;

-- ---------------------------------------------------------------------
-- Séances
-- ---------------------------------------------------------------------
alter table public.seances rename column mots_cles_proposes to mots_proposes;

alter table public.seances
  add column audio_duree_sec int,
  add column audio_source text check (audio_source in ('drive', 'depot')),
  add column mots_cles text[] not null default '{}',
  add column station_proposee text,
  add column station_validee text,
  add column transcript_segments jsonb,
  add column emilien_notifie_at timestamptz;

-- Ce qui a déjà été transmis à Émilien le reste : rien ne doit repartir.
update public.seances set emilien_notifie_at = envoye_emilien_at where envoye_emilien_at is not null;

-- « Ma préparation » : la Row Level Security filtre des lignes, pas des colonnes.
-- Dans public.seances, une cliente pourrait lire ce texte sur sa propre séance.
-- Table à part, réservée à Cloé (ni cliente, ni relecteur).
create table public.seances_preparations (
  seance_id uuid primary key references public.seances (id) on delete cascade,
  contenu text not null default '',
  updated_at timestamptz not null default now()
);
create trigger seances_preparations_updated_at before update on public.seances_preparations
  for each row execute function public.set_updated_at();
alter table public.seances_preparations enable row level security;
create policy "preparations coach" on public.seances_preparations for all to authenticated
  using (public.mon_role() = 'coach') with check (public.mon_role() = 'coach');

-- ---------------------------------------------------------------------
-- La lettre
-- ---------------------------------------------------------------------
alter table public.pratiques_series add column contenu text not null default '';

alter table public.pratiques
  add column slug text,
  add constraint pratiques_serie_slug_unique unique (serie_id, slug);

-- ---------------------------------------------------------------------
-- Le carnet unique : reponses fusionnée dans journal
-- ---------------------------------------------------------------------
alter table public.journal
  add column pratique_id uuid references public.pratiques (id) on delete set null,
  add column serie_id uuid references public.pratiques_series (id) on delete set null;
create index journal_pratique_idx on public.journal (pratique_id);
create index journal_serie_idx on public.journal (serie_id);

insert into public.journal (cliente_id, date, contenu, pratique_id, serie_id, created_at, updated_at)
select r.cliente_id, (r.updated_at at time zone 'Europe/Paris')::date, r.contenu,
       r.pratique_id, p.serie_id, r.created_at, r.updated_at
from public.reponses r
join public.pratiques p on p.id = r.pratique_id
where btrim(r.contenu) <> '';

drop table public.reponses;

-- ---------------------------------------------------------------------
-- Retours d'Émilien et ressources
-- ---------------------------------------------------------------------
alter table public.retours
  add column envoye_at timestamptz,
  add column ressource_proposee_url text,
  add column ressource_proposee_mot text;

alter table public.ressources
  add column image_url text,
  add column source text not null default 'cloe' check (source in ('cloe', 'emilien')),
  add column en_attente boolean not null default false;

-- ---------------------------------------------------------------------
-- Nouvelles tables
-- ---------------------------------------------------------------------
create table public.notes_emilien (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.profiles (id) on delete cascade,
  titre text not null default '',
  fichier_path text not null,
  deposee_at timestamptz not null default now()
);
create index notes_emilien_cliente_idx on public.notes_emilien (cliente_id);
alter table public.notes_emilien enable row level security;
create policy "notes lecture cliente" on public.notes_emilien for select to authenticated
  using (cliente_id = auth.uid());
create policy "notes equipe" on public.notes_emilien for all to authenticated
  using (public.est_equipe()) with check (public.est_equipe());

create table public.transcriptions (
  id uuid primary key default gen_random_uuid(),
  seance_id uuid not null references public.seances (id) on delete cascade,
  statut text not null default 'en_attente' check (statut in ('en_attente', 'en_cours', 'terminee', 'erreur')),
  erreur text,
  demarree_at timestamptz,
  terminee_at timestamptz,
  created_at timestamptz not null default now()
);
-- Drive peut prévenir plusieurs fois pour un même fichier : un seul traitement à la fois.
create unique index transcriptions_une_active on public.transcriptions (seance_id)
  where statut in ('en_attente', 'en_cours');
alter table public.transcriptions enable row level security;
create policy "transcriptions equipe" on public.transcriptions for all to authenticated
  using (public.est_equipe()) with check (public.est_equipe());

-- parcours_id facultatif : changes.watch surveille tout le Drive de Cloé (un canal, filtré ensuite par dossier).
-- Aucune politique : lisible et modifiable uniquement côté serveur (service_role).
create table public.drive_canaux (
  id uuid primary key default gen_random_uuid(),
  parcours_id uuid references public.parcours (id) on delete cascade,
  channel_id text not null unique,
  resource_id text not null,
  expiration timestamptz not null
);
alter table public.drive_canaux enable row level security;

-- Aucune politique : uniquement côté serveur (service_role).
create table public.emails_envoyes (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  destinataire text not null,
  seance_id uuid references public.seances (id) on delete cascade,
  envoye_at timestamptz not null default now()
);
-- Jamais deux fois : une fois par séance, ou une fois par jour pour un email sans séance.
create unique index emails_une_fois_par_seance on public.emails_envoyes (type, destinataire, seance_id)
  where seance_id is not null;
create unique index emails_une_fois_par_jour on public.emails_envoyes
  (type, destinataire, ((envoye_at at time zone 'Europe/Paris')::date))
  where seance_id is null;
alter table public.emails_envoyes enable row level security;

grant select, insert, update, delete on
  public.seances_preparations, public.notes_emilien, public.transcriptions
  to authenticated;
grant all on
  public.seances_preparations, public.notes_emilien, public.transcriptions,
  public.drive_canaux, public.emails_envoyes
  to service_role;

-- ---------------------------------------------------------------------
-- Stockage (audio et transcripts existent déjà)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('couvertures', 'couvertures', true, 10485760, array['image/jpeg', 'image/png', 'image/webp']),
  ('notes', 'notes', false, 52428800, array['application/pdf'])
on conflict (id) do nothing;

commit;
