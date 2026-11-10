# Fiche cliente, version équipe (retours de Cloé du 10 novembre 2026)

Complète et corrige `docs/02-brief-design-espace-cloe-emilien.md` (décision 8) et `docs/03-brief-construction.md`. Ce qui est écrit ici prime.

## 1. Ce qui ne va pas aujourd'hui

- La fiche cliente est le dashboard de la cliente avec des outils posés dessus. Cloé et Émilien n'y voient pas ce dont ils ont besoin pour travailler : les audios, le retour d'Émilien sur chaque séance, la préparation de chaque séance, un état synthétique du parcours. Le dépôt d'audio existe (page séance) mais il est hors de vue, en bas de la fiche derrière « Ouvrir la séance ».
- Pas de bouton pour se déconnecter (la route `/auth/deconnexion` existe, aucun lien n'y mène).
- Sur la fiche comme sur le dashboard cliente, la couverture prend tout l'écran à l'arrivée : on ne voit que le prénom, ni le chemin ni le début du contenu.
- Le chemin reste vide pour les clientes migrées : les séances venues de Notion n'ont ni mots ni station (pas de transcript texte, donc rien de proposé), et la matière historique (retours d'Émilien, préparations) est restée dans le Drive, jamais importée.

## 2. Décisions

1. La fiche cliente devient la vue équipe. Elle remplace la décision 8 du brief 02. Le dashboard de la cliente reste accessible en un geste depuis la fiche, par un bouton « Voir comme elle », qui ouvre son espace tel qu'elle le voit (lecture, avec les outils actuels de Cloé posés sur les zones : couverture, intention, lettre, ressource, note d'Émilien). Donc deux pages par cliente : `/coach/clientes/[id]` (vue équipe) et `/coach/clientes/[id]/espace` (son espace vu par nous, ce qui est la fiche d'aujourd'hui).
2. Un bouton « Se déconnecter » partout : dans l'en-tête de l'espace Cloé et de l'espace Émilien (discret, à droite), et dans le pied de l'espace cliente à côté de « à propos » et « contact ».
3. Hauteur de la couverture, règle pour toutes les pages qui en ont une (dashboard cliente, fiche, « voir comme elle ») : sur téléphone, la couverture occupe au plus 55 % de la hauteur de l'écran ; le tracé du chemin est entièrement visible sans défiler ; le début du bloc suivant dépasse sous le pli. Sur ordinateur, couverture au plus 60 % de la hauteur, même règle pour le chemin. La planche A reste la référence pour le dessin, c'est la hauteur qui change.
4. Note de parcours : un texte libre partagé par Cloé et Émilien, par cliente, qui dit où elle en est (`parcours.note_equipe`, avec `note_equipe_modifiee_par` et `note_equipe_modifiee_at`). Jamais visible par la cliente. Les deux peuvent l'écrire.
5. Matière historique : les retours d'Émilien et les préparations de séances des clientes migrées sont importés depuis le dossier Drive de Cloé (Google Drive synchronisé sur son Mac). Un script `scripts/importer-drive.ts` lit un dossier par cliente, reconnaît les fichiers par leur nom (« Retour Emilien Deborah 3 », « Prep Déborah Session 3 », « Session 3 Déborah Transcript », « Note Déborah »…), propose la correspondance fichier → séance en lecture à blanc, puis importe après validation de Cloé : le PDF dans le bucket (`retours`, `preparations`, `transcripts`, `notes`), le texte extrait dans `retours.contenu`, `seances_preparations.contenu`, ou le transcript Markdown de la séance. Les retours historiques sont marqués comme envoyés à la date du fichier.
6. Chemin des clientes migrées : tant qu'une séance n'a ni mots ni station, la fiche le dit en rouge dans la ligne de la séance (« mots à poser ») et le champ est saisissable sur place. Cloé pose les mots elle-même pour les séances passées, à partir de la matière importée (les transcripts texte permettent aussi la proposition automatique une fois importés).

## 3. La vue équipe, de haut en bas

Papier dominant, violet en bandeau. Mobile d'abord.

1. Bandeau : couverture en bande (160 px sur téléphone, 220 px sur ordinateur), prénom, point du cycle (« entre la séance 3 et la séance 4 »), prochaine séance avec sa date, trois actions : « Voir comme elle », « Nouvelle séance », « Avant la séance » (vers la prochaine).
2. « Il reste à faire » pour cette cliente seulement : mêmes points d'état que l'agenda (transcript, Émilien, lettre), rouge si en retard.
3. « Où elle en est » : la note de parcours (texte, auteur et date de la dernière modification, « Modifier » sur place), l'intention, le tracé du chemin, la dernière météo et la trace des dernières.
4. « Les séances » : une ligne par séance, la plus récente en tête, repliable. Ligne repliée : numéro, date, trois mots, station, et quatre pastilles d'état (audio, transcript, retour d'Émilien, lettre). Ligne dépliée : les quatre objets côte à côte (deux par deux sur téléphone) :
   - Audio : lecteur si présent, sinon zone de dépôt (le dépôt direct vers Storage existe déjà sur la page séance, on le réutilise).
   - Transcript : « Lire », sinon dépôt (texte ou PDF), ou « en cours » pendant la transcription.
   - Retour d'Émilien : texte lu sur place (replié après quelques lignes), date, PDF si importé ; pour Émilien, « Écrire mon retour » vers sa page.
   - Préparation : visible par Cloé seulement, « Ma préparation » (texte, PDF si importé), lien vers « Avant la séance ».
   - Sous les quatre : la lettre envoyée après cette séance (titre, date, « Ouvrir »), et les mots et station à valider si une proposition attend.
   - « Ouvrir la séance » reste le lien vers la page séance complète (planche J), mais tout l'essentiel se fait depuis la ligne.
5. « Notes d'Émilien » : les notes PDF déposées dans l'espace de la cliente, avec date et « Déposer une note ».
6. « Son carnet » : les entrées « à aborder en séance » d'abord, puis les trois dernières, lecture seule, lien vers le carnet complet dans « Voir comme elle ».
7. « Ses ressources » : les ressources partagées avec leur suivi (à découvrir, commencé, terminé), « Partager une ressource ».
8. Compte : email, lien d'accès, dossier Drive relié, « Voir comme elle » répété.

Émilien voit la même page sans la préparation et sans les outils d'écriture de Cloé (lettre, couverture, intention), avec « Écrire mon retour » sur chaque séance sans retour et la note de parcours modifiable.

## 4. Modèle de données

Migration `0004_vue_equipe.sql` :
- `parcours.note_equipe text`, `parcours.note_equipe_modifiee_par uuid references profiles`, `parcours.note_equipe_modifiee_at timestamptz`. RLS : lecture et écriture équipe seulement (`est_equipe()`), jamais la cliente (vérifier que la politique de lecture cliente sur `parcours` exclut ces colonnes, sinon passer par une vue ou une table à part `parcours_notes_equipe`).
- `retours.fichier_path text` (PDF importé), `retours.source text` (`plateforme` ou `drive`).
- `seances_preparations.fichier_path text`, `seances_preparations.source text`.
- Bucket `preparations` privé, politique équipe, comme `notes`.

## 5. Ordre

1. Déconnexion (trois endroits) et hauteur de couverture : tout de suite, sans attendre les maquettes.
2. Migration 0004 et script d'import Drive en lecture à blanc, montré à Cloé, puis import réel.
3. Vue équipe construite à partir de ce document, en reprenant les composants existants (Carte séance, lecteur, dépôt, Outils). La fiche actuelle est déplacée sur `/coach/clientes/[id]/espace`. Claude Design produit en parallèle une planche I v2 à partir de la section 3 ; si la planche arrive avant la construction, elle prime sur ce texte pour le dessin, pas pour le contenu.
4. Captures 390 px, build, lint, `docs/EN-COURS.md` à jour, push.
