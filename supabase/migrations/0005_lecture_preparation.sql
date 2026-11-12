-- 0005_lecture_preparation.sql : lire, écrire, préparer (docs/06-lecture-ecriture-preparation.md, section 3, point 3).
-- À coller en une fois dans Supabase > SQL Editor. Tout passe, ou rien ne change.
begin;

-- ---------------------------------------------------------------------
-- 1. Version lisible d'un retour d'Émilien.
-- Même table, donc même protection : « retours equipe » réserve déjà toute la table
-- à Cloé et Émilien, la cliente n'en lit aucune ligne.
-- Si le texte d'origine change sans que la version lisible soit refaite dans la même
-- écriture, la version lisible est effacée : on n'affiche jamais une mise en forme périmée.
-- ---------------------------------------------------------------------
alter table public.retours
  add column contenu_lisible text,
  add column contenu_lisible_at timestamptz;

create or replace function public.retour_lisible_a_jour()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.contenu is distinct from old.contenu and new.contenu_lisible is not distinct from old.contenu_lisible then
    new.contenu_lisible := null;
    new.contenu_lisible_at := null;
  end if;
  return new;
end;
$$;
create trigger retours_lisible_a_jour before update on public.retours
  for each row execute function public.retour_lisible_a_jour();

-- ---------------------------------------------------------------------
-- 2. Ce que Cloé a vu du carnet : journal.vu_par_coach_at.
-- La cliente écrit dans son carnet (« journal cliente »), l'équipe ne fait que lire.
-- La marque « vu » ne se pose donc que par la fonction marquer_carnet_vu(), réservée à Cloé.
-- Quand la cliente écrit ou modifie un texte, la marque retombe d'elle-même : elle ne peut
-- ni la poser, ni la garder sur un texte changé.
-- ---------------------------------------------------------------------
alter table public.journal add column vu_par_coach_at timestamptz;

create or replace function public.journal_vu_par_coach()
returns trigger language plpgsql set search_path = public as $$
begin
  if public.mon_role() = 'coach' then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.vu_par_coach_at := null;
  elsif new.contenu is distinct from old.contenu then
    new.vu_par_coach_at := null;
  else
    new.vu_par_coach_at := old.vu_par_coach_at;
  end if;
  return new;
end;
$$;
create trigger journal_vu_par_coach before insert or update on public.journal
  for each row execute function public.journal_vu_par_coach();

create or replace function public.marquer_carnet_vu(p_cliente uuid)
returns integer language plpgsql security definer set search_path = public as $$
declare
  n integer;
begin
  if public.mon_role() is distinct from 'coach' then
    raise exception 'réservé à Cloé';
  end if;
  update public.journal set vu_par_coach_at = now()
    where cliente_id = p_cliente and vu_par_coach_at is null;
  get diagnostics n = row_count;
  return n;
end;
$$;
revoke all on function public.marquer_carnet_vu(uuid) from public, anon;
grant execute on function public.marquer_carnet_vu(uuid) to authenticated;

-- Ce qui est déjà écrit compte comme vu : la marque « a écrit » ne vaut que pour la suite.
update public.journal set vu_par_coach_at = now() where vu_par_coach_at is null;

-- ---------------------------------------------------------------------
-- 3. Journal des accès du connecteur (acces_mcp) : un appel, une ligne.
-- Ni modifiable ni effaçable depuis l'application. Cloé seule le lit et l'écrit
-- (le connecteur agira en son nom) ; Émilien et les clientes n'y ont aucun accès.
-- ---------------------------------------------------------------------
create table public.acces_mcp (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  utilisateur_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  outil text not null,
  cliente_id uuid references public.profiles (id) on delete set null,
  seance_numero integer,
  resultat text not null default 'ok' check (resultat in ('ok', 'refuse', 'erreur'))
);
create index acces_mcp_at_idx on public.acces_mcp (at desc);

alter table public.acces_mcp enable row level security;
create policy "acces mcp coach lecture" on public.acces_mcp for select to authenticated
  using (public.mon_role() = 'coach');
create policy "acces mcp coach ecriture" on public.acces_mcp for insert to authenticated
  with check (public.mon_role() = 'coach' and utilisateur_id = auth.uid());

commit;
