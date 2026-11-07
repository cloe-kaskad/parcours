-- Les 7 états de la météo du jour (libellés modifiables), et table musiques déjà créée.
insert into public.meteo_etats (code, libelle, ordre) values
  ('claire', 'Claire', 1),
  ('posee', 'Posée', 2),
  ('vive', 'Vive', 3),
  ('fatiguee', 'Fatiguée', 4),
  ('tendue', 'Tendue', 5),
  ('brumeuse', 'Brumeuse', 6),
  ('bousculee', 'Bousculée', 7)
on conflict (code) do update set libelle = excluded.libelle, ordre = excluded.ordre;

-- La météo peut être modifiée dans la journée : on garde une ligne par jour et par cliente.
alter table public.meteo add column if not exists updated_at timestamptz not null default now();
drop trigger if exists meteo_updated_at on public.meteo;
create trigger meteo_updated_at before update on public.meteo
  for each row execute function public.set_updated_at();
