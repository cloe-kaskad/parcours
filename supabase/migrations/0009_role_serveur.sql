-- ---------------------------------------------------------------------
-- 0009 : le rôle d'un nouveau compte ne vient plus de ce que la personne déclare
-- (19 novembre 2026, avant la connexion par Google et par mot de passe, docs/09 section 5)
--
-- Jusqu'ici, handle_new_user lisait le rôle dans raw_user_meta_data : une donnée que
-- la personne fournit elle-même à l'inscription. Avec les inscriptions ouvertes, un
-- inconnu pouvait se déclarer « coach ». Désormais le rôle vient de raw_app_meta_data,
-- que seul le serveur (clé service_role, création de compte par Cloé) peut écrire.
-- Sans rôle fixé par le serveur, un compte est « cliente » et ne voit que ses lignes.
--
-- Les 7 comptes existants ne changent pas (vérifiés le 19 novembre : tous créés par Cloé).
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  r public.role_type := 'cliente';
begin
  if new.raw_app_meta_data ? 'role'
     and new.raw_app_meta_data ->> 'role' in ('cliente', 'coach', 'relecteur') then
    r := (new.raw_app_meta_data ->> 'role')::public.role_type;
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
