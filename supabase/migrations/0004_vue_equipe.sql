-- 0004_vue_equipe.sql : la fiche cliente en vue équipe (docs/04-fiche-cliente-vue-equipe.md, section 4).
-- À coller en une fois dans Supabase > SQL Editor. Tout passe, ou rien ne change.
begin;

-- ---------------------------------------------------------------------
-- Note de parcours, partagée par Cloé et Émilien, jamais visible par la cliente.
--
-- Pourquoi une table à part et pas trois colonnes sur public.parcours :
-- la Row Level Security filtre des lignes, pas des colonnes. La politique
-- « parcours lecture » laisse la cliente lire sa ligne de parcours en entier,
-- donc une colonne note_equipe y serait lisible par elle. Ici, la table n'a
-- qu'une politique, réservée à l'équipe : la cliente n'y lit et n'y écrit rien.
-- ---------------------------------------------------------------------
create table public.parcours_notes_equipe (
  parcours_id uuid primary key references public.parcours (id) on delete cascade,
  note_equipe text not null default '',
  note_equipe_modifiee_par uuid references public.profiles (id) on delete set null,
  note_equipe_modifiee_at timestamptz not null default now()
);

-- L'auteur et la date se posent tout seuls à chaque écriture.
create or replace function public.signer_note_equipe()
returns trigger language plpgsql set search_path = public as $$
begin
  new.note_equipe_modifiee_par := coalesce(auth.uid(), new.note_equipe_modifiee_par);
  new.note_equipe_modifiee_at := now();
  return new;
end;
$$;
create trigger parcours_notes_equipe_signature before insert or update on public.parcours_notes_equipe
  for each row execute function public.signer_note_equipe();

alter table public.parcours_notes_equipe enable row level security;
create policy "notes parcours equipe" on public.parcours_notes_equipe for all to authenticated
  using (public.est_equipe()) with check (public.est_equipe());

-- ---------------------------------------------------------------------
-- Retours d'Émilien et préparations : fichier importé du Drive et origine.
-- ---------------------------------------------------------------------
alter table public.retours
  add column fichier_path text,
  add column source text not null default 'plateforme' check (source in ('plateforme', 'drive'));

alter table public.seances_preparations
  add column fichier_path text,
  add column source text not null default 'plateforme' check (source in ('plateforme', 'drive'));

-- ---------------------------------------------------------------------
-- Stockage : les PDF de retours et de préparations.
-- Buckets privés, fichiers servis par URLs signées côté serveur.
-- « retours » : équipe, comme « notes » (politique « storage equipe » de 0001).
-- « preparations » : Cloé seule, comme la table seances_preparations ; on
-- retire donc ce bucket de « storage equipe » pour qu'Émilien ne puisse pas
-- le lire directement par l'API de stockage.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('retours', 'retours', false, 52428800, array['application/pdf']),
  ('preparations', 'preparations', false, 52428800, array['application/pdf'])
on conflict (id) do nothing;

drop policy "storage equipe" on storage.objects;
create policy "storage equipe" on storage.objects for all to authenticated
  using (public.est_equipe() and bucket_id <> 'preparations')
  with check (public.est_equipe() and bucket_id <> 'preparations');
create policy "storage preparations coach" on storage.objects for all to authenticated
  using (bucket_id = 'preparations' and public.mon_role() = 'coach')
  with check (bucket_id = 'preparations' and public.mon_role() = 'coach');

commit;
