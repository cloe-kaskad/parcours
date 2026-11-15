-- ---------------------------------------------------------------------
-- 0008 : la version séance de la préparation (brief « mode en séance », 15 novembre 2026)
--
-- La préparation allégée pour la conduite de la séance, proposée depuis la
-- préparation puis modifiable par Cloé section par section. Elle ne modifie
-- jamais la préparation (colonne `contenu`, inchangée).
--
-- version_seance : liste de sections, dans l'ordre de la préparation :
--   [{ "titre": "Profil du moment", "duree": "0 à 10 min",
--      "blocs": [ { "type": "texte", "contenu": "… Markdown …" },
--                 { "type": "integral", "titre": "Visualisation guidée", "contenu": "… mot pour mot …" } ] }]
-- version_seance_empreinte : l'empreinte de la préparation au moment de la
--   proposition, pour afficher « la préparation a changé, reproposer ? ».
-- version_seance_at : date de la dernière proposition ou modification.
--
-- Même règle que la préparation : Cloé seule. La politique « preparations coach »
-- (0003) couvre déjà toute la ligne, donc ces colonnes ; ni la cliente ni
-- Émilien ne les lisent. Rien d'autre ne change.
-- ---------------------------------------------------------------------
alter table public.seances_preparations
  add column version_seance jsonb,
  add column version_seance_empreinte text,
  add column version_seance_at timestamptz;

alter table public.seances_preparations
  add constraint version_seance_est_une_liste
  check (version_seance is null or jsonb_typeof(version_seance) = 'array');
