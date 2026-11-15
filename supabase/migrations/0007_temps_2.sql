-- 0007_temps_2.sql : chantier fluidité, temps 2 (docs/07-plan-temps-2.md).
-- À coller en une fois dans Supabase > SQL Editor, APRÈS 0006. Tout passe, ou rien ne change.
--
-- La recherche, la commande rapide, les mots récurrents, le fil et le bilan de cycle
-- n'ont besoin d'aucune donnée nouvelle : ils lisent ce qui existe.
begin;

-- ---------------------------------------------------------------------
-- 1. Résumé de séance : cinq lignes proposées, validées par Cloé.
-- Dans une table à part : la table seances est lisible par la cliente,
-- le résumé ne l'est pas. Cloé et Émilien seulement.
-- ---------------------------------------------------------------------
create table public.seances_resumes (
  seance_id uuid primary key references public.seances(id) on delete cascade,
  resume_propose text,
  resume text,
  updated_at timestamptz not null default now()
);
alter table public.seances_resumes enable row level security;
create policy "resumes equipe" on public.seances_resumes for all to authenticated
  using (public.est_equipe()) with check (public.est_equipe());

-- ---------------------------------------------------------------------
-- 4. Mode en séance : les notes prises pendant la visio, rangées avec
-- « Ma préparation » (même table, donc Cloé seule, règle de 0004).
-- ---------------------------------------------------------------------
alter table public.seances_preparations add column notes_seance text not null default '';

-- ---------------------------------------------------------------------
-- 5. Phrases épinglées : une phrase d'un transcript, du carnet, d'un retour
-- ou d'une lettre, pour la prochaine séance. Équipe seulement.
-- ---------------------------------------------------------------------
create table public.epingles (
  id uuid primary key default gen_random_uuid(),
  parcours_id uuid not null references public.parcours(id) on delete cascade,
  seance_id uuid references public.seances(id) on delete set null,
  source text not null check (source in ('transcript', 'carnet', 'retour', 'lettre')),
  texte text not null check (char_length(texte) between 1 and 2000),
  auteur_id uuid not null default auth.uid() references public.profiles(id),
  created_at timestamptz not null default now()
);
create index epingles_parcours_idx on public.epingles (parcours_id);
alter table public.epingles enable row level security;
create policy "epingles equipe" on public.epingles for all to authenticated
  using (public.est_equipe()) with check (public.est_equipe());

-- ---------------------------------------------------------------------
-- 6 et 11. Cloé et Émilien, par séance : un fil court sous le retour,
-- et une remarque d'Émilien sous un exercice (pratique_id renseigné).
-- Équipe seulement, comme les retours. Chacun n'écrit, ne modifie et
-- n'efface que ses propres messages.
-- ---------------------------------------------------------------------
create table public.echanges (
  id uuid primary key default gen_random_uuid(),
  seance_id uuid not null references public.seances(id) on delete cascade,
  pratique_id uuid references public.pratiques(id) on delete cascade,
  auteur_id uuid not null default auth.uid() references public.profiles(id),
  texte text not null check (char_length(texte) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index echanges_seance_idx on public.echanges (seance_id);
alter table public.echanges enable row level security;
create policy "echanges lecture equipe" on public.echanges for select to authenticated
  using (public.est_equipe());
create policy "echanges ecriture" on public.echanges for insert to authenticated
  with check (public.est_equipe() and auteur_id = auth.uid());
create policy "echanges modification" on public.echanges for update to authenticated
  using (public.est_equipe() and auteur_id = auth.uid()) with check (auteur_id = auth.uid());
create policy "echanges effacement" on public.echanges for delete to authenticated
  using (public.est_equipe() and auteur_id = auth.uid());

-- ---------------------------------------------------------------------
-- 9. Vocaux de la cliente : une minute enregistrée depuis son espace,
-- rangée dans son carnet (journal). Le fichier va dans un espace privé,
-- dans un dossier à son nom : elle ne lit et n'écrit que le sien.
-- L'équipe lit tout (politique « storage equipe » de 0004).
-- ---------------------------------------------------------------------
alter table public.journal
  add column audio_path text,
  add column audio_duree_sec integer check (audio_duree_sec between 1 and 90),
  add constraint journal_audio_a_elle check (audio_path is null or audio_path like cliente_id::text || '/%');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('vocaux', 'vocaux', false, 5242880, array['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg', 'audio/x-m4a', 'audio/aac']);

create policy "vocaux cliente lecture" on storage.objects for select to authenticated
  using (bucket_id = 'vocaux' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "vocaux cliente depot" on storage.objects for insert to authenticated
  with check (bucket_id = 'vocaux' and (storage.foldername(name))[1] = auth.uid()::text);

commit;
