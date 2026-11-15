-- 0006_phrase_cle.sql : chantier fluidité, « Avant la séance » (temps 1, point 1).
-- À coller en une fois dans Supabase > SQL Editor. Tout passe, ou rien ne change.
--
-- La carte du retour d'Émilien affiche une phrase clé et trois points au plus.
-- Même mécanique que les trois mots d'une séance : une proposition (lue dans le retour),
-- puis une version validée par Cloé ou Émilien. Seule la version validée s'affiche comme
-- phrase clé ; tant qu'elle est vide, la carte montre les premières lignes du retour.
--
-- Même table, donc même protection : « retours equipe » (0001) réserve déjà toute la table
-- à Cloé et Émilien, la cliente n'en lit aucune ligne. Rien à ajouter côté sécurité.
begin;

alter table public.retours
  add column phrase_cle_proposee text,
  add column points_cles_proposes text[] not null default '{}',
  add column phrase_cle text,
  add column points_cles text[] not null default '{}',
  add constraint retours_points_cles_trois check (cardinality(points_cles) <= 3),
  add constraint retours_points_cles_proposes_trois check (cardinality(points_cles_proposes) <= 3);

-- Si Émilien réécrit son retour, la proposition (lue dans l'ancien texte) est effacée.
-- La version validée reste : c'est une décision de Cloé ou d'Émilien, ils la changent eux-mêmes.
create or replace function public.retour_proposition_a_jour()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.contenu is distinct from old.contenu
     and new.phrase_cle_proposee is not distinct from old.phrase_cle_proposee
     and new.points_cles_proposes is not distinct from old.points_cles_proposes then
    new.phrase_cle_proposee := null;
    new.points_cles_proposes := '{}';
  end if;
  return new;
end;
$$;
create trigger retours_proposition_a_jour before update on public.retours
  for each row execute function public.retour_proposition_a_jour();

commit;
