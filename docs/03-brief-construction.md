# Brief de construction : reconstruire la plateforme à partir des maquettes

Version 1, 9 novembre 2026. À lire par Claude Code avant toute modification. Les maquettes (`design/`) et les deux briefs (`docs/01`, `docs/02`) font foi ; ce document dit quoi garder, quoi remplacer, dans quel ordre, et comment traiter les points techniques.

## 1. État du repo (ce qui existe)

- Next.js 16, Tailwind 4, Supabase (Postgres, auth par lien magique, Storage), Vercel. Secrets dans Vercel, récupérés en local par `vercel env pull .env.local --environment=production` (Doppler abandonné).
- Schéma : `supabase/migrations/0001_init.sql` et `0002_meteo.sql`, appliqués en production. RLS partout.
- Données réelles en base : Déborah, Vanessa, Flora, Sarah migrées depuis Notion (parcours, séances, envois d'exercices, ressources, journal, feedback). Comptes Cloé (coach) et Émilien (relecteur). Les dates de séances sont vides. Détail : `docs/EN-COURS.md`.
- Interface actuelle : une première version (pages sous `src/app/(cliente)` et `src/app/(coach)`, composants sous `src/components`) jugée très en dessous de l'attendu. Elle est remplacée entièrement par les maquettes.

## 2. Ce qu'on garde, ce qu'on remplace

Garder tel quel : la configuration Next et Vercel, `src/proxy.ts`, `src/lib/supabase/*`, `src/lib/auth.ts`, `src/lib/fichiers.ts`, `src/lib/dates.ts`, le flux de connexion (`src/app/connexion`, `src/app/auth`), `scripts/migrer-notion.ts`, la page `/coach/diagnostic`, les polices auto-hébergées (`@fontsource`, pas Google Fonts : les maquettes chargent Google Fonts, on ne reproduit pas ça).

Garder en l'adaptant : `src/lib/actions/*` (la logique métier est bonne, les actions seront réorganisées autour des nouveaux écrans), `src/lib/db/*`.

Remplacer entièrement : toutes les pages de `src/app/(cliente)` et `src/app/(coach)`, `src/components/*` (Coquille, Onglets, ui, Meteo, Icones…), `src/app/globals.css`. On repart des maquettes, planche par planche, en traduisant chaque `.dc.html` en composants React (le README de `design/` explique le format : le HTML/CSS utile est dans `<x-dc>`, les `<sc-for>`, `<sc-if>`, `{{holes}}` et le script `x-dc` sont la logique d'état du prototype, à réécrire en React, pas à copier).

## 3. Modèle de données : ce qui change

Nouvelle migration `0003_maquettes.sql` (une seule, lisible), puis types mis à jour :

- `parcours` : `couverture_path text` (image dans le bucket `couvertures`, public en lecture via URL signée longue ou bucket public), `drive_folder_id text`, `drive_folder_nom text`.
- `seances` : `audio_path text` existe ; ajouter `audio_duree_sec int`, `audio_source text` (`drive` | `depot`), `mots_cles text[]` (validés, affichés sur le chemin et la carte séance), `mots_proposes text[]`, `station_proposee text`, `station_validee text`, `preparation text` (zone privée de Cloé, jamais exposée à la cliente ni à Émilien : vérifier la politique RLS en lecture pour le relecteur), `transcript_segments jsonb` (prises de parole : locuteur, début, texte), `emilien_notifie_at timestamptz` (remplace l'usage de `envoye_emilien_at`).
- `pratiques_series` devient la lettre : ajouter `contenu text` (le Markdown complet collé par Cloé), `titre` conserve « Pour la séance N ». La table `pratiques` reste pour ancrer les notes : à chaque enregistrement de la lettre, les exercices sont dérivés des titres de niveau 2 ou 3 du Markdown (un exercice = un titre), avec un identifiant stable (slug du titre) pour que les notes survivent à une réécriture. Les encadrés « Pourquoi ça compte » sont reconnus par le Markdown : une citation (`>`) ou un paragraphe commençant par « Pourquoi ça compte » ou « Pourquoi c'est important ».
- Le carnet unique : `journal` gagne `pratique_id uuid null` et `serie_id uuid null`. La table `reponses` est fusionnée dans `journal` (migration des données existantes : chaque réponse devient une entrée de journal datée de sa dernière modification, reliée à sa pratique), puis supprimée.
- `retours` : ajouter `envoye_at timestamptz` (brouillon tant que nul), `ressource_proposee_url text`, `ressource_proposee_mot text`.
- `ressources` : ajouter `image_url text`, `source text` (`cloe` | `emilien`), `en_attente boolean` (proposée par Émilien, pas encore validée).
- `musiques` : inchangée ; `meteo_etats` : inchangée.
- Nouvelles tables : `notes_emilien` (cliente_id, titre, fichier_path, deposee_at), `transcriptions` (seance_id, statut `en_attente` | `en_cours` | `terminee` | `erreur`, erreur, démarrée_at, terminée_at), `drive_canaux` (parcours_id, channel_id, resource_id, expiration), `emails_envoyes` (type, destinataire, seance_id, envoyé_at) pour ne jamais envoyer deux fois.
- Buckets : `couvertures` (lecture publique acceptable : ce sont des images choisies par Cloé, pas des données de clientes), `audio`, `transcripts`, `notes`.

## 4. Ordre de construction

Chaque étape se termine par : `npm run build` et `npm run lint` qui passent, des captures mobile 390 px comparées à la planche correspondante, un commit, un push sur `main`, et une mise à jour de `docs/EN-COURS.md`. Cloé valide sur le vrai site avant l'étape suivante.

Étape 1, le socle visuel et le dashboard cliente (planches A, F, composants-espace-cliente, principes)
- Jetons de design dans `globals.css` à partir de la planche `principes` et du README (palette, grain du papier, typographies, rayons, espacements).
- Composants de base : Papier (surface crème avec grain), Pastille météo, Carte ressource (3 états), Carte séance, Entrée de carnet, Geste Écrire (fermé, ouvert, note affichée), Encadré « Pourquoi ça compte », Tracé du chemin (SVG généré : une station par séance faite, mots validés posés le long, prochaine station sans nom).
- Dashboard `/espace` : les huit zones de la planche A, données réelles de Déborah. Couverture : image par défaut (`design/assets/couverture-deborah.jpg` copiée dans le bucket) tant que Cloé n'en a pas choisi une.
- Connexion `/connexion` refaite selon F. Suppression de la barre d'onglets et de toutes les anciennes pages cliente.

Étape 2, lire et écrire (planches B, C, D, E)
- `/espace/lettre/[id]` : la lettre en lecture pleine page à partir du Markdown (`pratiques_series.contenu`), exercices dérivés des titres, geste Écrire sous chaque exercice et en fin de lettre, notes stockées dans `journal`.
- `/espace/carnet` : carnet complet, écriture sur place, marqueur « à aborder en séance ».
- `/espace/seance/[id]` : lecture du transcript (texte courant, prises de parole depuis `transcript_segments` quand disponibles, sinon le Markdown).
- `/espace/ressources` : médiathèque, filtres, suivi en un geste, lien externe.
- Reconstitution des lettres existantes : pour chaque série migrée, générer `contenu` à partir de l'intro et des pratiques (titre en `##`, consigne, règles, « Pourquoi ça compte » en citation), puis vérifier le rendu pour Déborah.

Étape 3, l'espace de Cloé (planches H, I, J, K, L, M, N, composants-espace-cloe)
- `/coach` : l'agenda, états calculés comme aujourd'hui (transcript à J+1, exercices à J+7), seulement pour les séances postérieures à l'ouverture de la plateforme ou datées.
- `/coach/clientes/[id]` : la fiche, c'est-à-dire le dashboard cliente rendu avec les outils de Cloé (un composant `Outils` au-dessus de chaque zone). Les formulaires s'ouvrent en place ou en feuille, jamais en page séparée à onglets.
- `/coach/clientes/[id]/seances/[id]` : le fil en quatre temps ; dépôt manuel d'audio en upload direct vers Storage (URL signée d'upload, le fichier ne passe pas par le serveur Next) ; lecteur ; mots et station proposés à valider.
- `/coach/clientes/[id]/lettre/[id]` : l'éditeur un seul bloc (textarea Markdown stylée en papier, aperçu en dessous ou à côté), collage conservé, volet sources, « Envoyer » qui rend la lettre visible et affiche le texte WhatsApp à copier.
- `/coach/clientes/[id]/seances/[id]/avant` : « Avant la séance », avec la zone « Ma préparation ».
- `/coach/ressources` : coller un lien (route serveur qui lit les balises `og:` et `oEmbed` avec un délai court et un repli propre), carte à valider, partager.
- `/coach/clientes/nouvelle` : création avec couverture (banque de dix images fournies dans `public/couvertures/` au départ ; la génération d'image viendra plus tard) et dossier Drive (saisie de l'identifiant ou du lien du dossier).
- Formulaire de date pour les quinze séances migrées (saisie rapide depuis l'agenda ou la fiche).

Étape 4, l'espace d'Émilien et la chaîne transcription (planches O, P, emails)
- `/emilien` : « À lire » ; `/emilien/seances/[id]` : lecteur avec vitesse et position mémorisée (localStorage), transcript, retour en marge, ressource à proposer, « Envoyer à Cloé ».
- Transcription : voir section 5. Déclencheurs : dépôt manuel, ou arrivée d'un fichier dans le dossier Drive relié.
- Après transcription : formatage en Markdown et segments, PDF (design ivoire et Lora, même esprit que les notes d'Émilien), proposition de trois mots et d'une station (modèle Anthropic, consigne courte, réponse JSON), email à Émilien (Resend, modèle `email-transcript-pret-emilien`), `emilien_notifie_at`.
- Email à Cloé quand Émilien envoie son retour.

Étape 5, rappels et ouverture
- Tâche planifiée quotidienne (Vercel Cron, 7h Paris) : email J-3 aux clientes (modèle G), email de retards à Cloé (modèle `email-retards-cloe`), renouvellement des canaux Drive et vérification de sécurité des dossiers.
- Événement Google Agenda à J+7 « Exercices pour [prénom] » créé quand une séance passe à « faite ».
- Ouverture : Cloé envoie les liens d'accès ; vérification finale sur téléphone pour chaque cliente ; résiliation de Notion.

## 5. Points techniques

Transcription (la seule brique qui ne tient pas dans une fonction Vercel) : un audio d'une heure trente pèse 60 à 120 Mo, au-dessus de la limite de 25 Mo par requête de l'API OpenAI, et le traitement dépasse la durée d'une fonction Vercel. Deux options, à trancher à l'étape 4 :
- Option recommandée : un petit service de traitement sur le VPS Hostinger de Cloé (où tourne déjà Hermes), en Node avec ffmpeg, qui lit la table `transcriptions` toutes les minutes, télécharge l'audio depuis Storage, le découpe en segments de 10 minutes, appelle OpenAI (`gpt-4o-transcribe` ou `whisper-1`), recolle, attribue les locuteurs (Cloé / cliente) par un passage LLM sur le texte, écrit le résultat, puis la plateforme enchaîne (PDF, mots, email). Secrets du service : les mêmes que Vercel, posés sur le VPS.
- Option sans serveur : Deepgram (nova-3, `diarize=true`, accepte des fichiers lourds par URL signée et répond par webhook). Plus simple à brancher, locuteurs natifs, mais un prestataire de plus et des crédits à ouvrir ; les crédits OpenAI existants servent alors au formatage et aux mots.
Dans les deux cas, l'audio reste dans Storage (bucket privé) et Émilien l'écoute via URL signée.

Google Drive : une autorisation OAuth de Cloé (projet Google Cloud, scopes Drive lecture et Calendar écriture), jeton de rafraîchissement stocké dans Vercel. Surveillance par `changes.watch` sur son Drive avec filtrage par dossier parent (les canaux expirent au bout d'une semaine : renouvelés par la tâche quotidienne), réception sur `/api/drive/notification`, puis insertion dans `transcriptions` et copie du fichier vers Storage. La tâche quotidienne liste aussi chaque dossier relié pour rattraper un fichier manqué.

Upload direct : tout fichier lourd (audio, PDF, couverture) part du navigateur vers Storage avec une URL d'upload signée créée côté serveur. Jamais via une action serveur (limite 4,5 Mo sur Vercel).

Métadonnées de lien : route `/api/lien` qui récupère `og:title`, `og:image`, `og:description`, l'auteur si disponible, avec un délai de 5 secondes et un rendu dégradé (titre = nom de domaine) si rien n'est trouvé. Pour Spotify, YouTube, France Culture et Radio France, utiliser l'oEmbed quand il existe.

Emails : Resend, expéditeur `parcours@amarecherche.fr`, modèles React Email reproduisant les planches G, `email-retards-cloe`, `email-transcript-pret-emilien`. Journal dans `emails_envoyes`.

Sécurité : RLS inchangée dans l'esprit. Vérifier en particulier que `seances.preparation`, `retours` et `transcript_segments` bruts ne sont jamais lisibles par une cliente, et que `preparation` n'est pas lisible par le relecteur (vue ou colonne filtrée côté serveur).

## 6. Vocabulaire de l'interface

Lettre (pas « série », pas « envoi » dans l'interface), exercice, carnet, « à aborder en séance », mémoire, séance, « Pour toi » / ressources, météo, chemin, couverture, « Écrire », « Lire la lettre », « Lire la séance », « Envoyer à [prénom] », « Avant la séance », « Ma préparation », « À lire », « Mon retour ». Jamais : publié, statut, affectation, série, pratique (sauf dans le code), dashboard.

## 7. Prompt de départ pour Claude Code

```
Lis dans l'ordre : CLAUDE.md, docs/03-brief-construction.md, docs/01-brief-design-espace-cliente.md, docs/02-brief-design-espace-cloe-emilien.md, design/README.md, puis docs/EN-COURS.md pour l'état réel. Ouvre ensuite les planches design/ecrans/principes.dc.html, composants-espace-cliente.dc.html et A-dashboard-mobile.dc.html.

On reconstruit l'interface à partir des maquettes, en suivant les étapes du brief de construction. Commence par l'étape 1 : propose-moi d'abord, sans coder, la liste des jetons de design et des composants que tu vas créer à partir des planches, et la migration 0003 (SQL complet). Je valide, puis tu construis le dashboard cliente avec les vraies données de Déborah, tu fais des captures mobile 390 px à côté de la planche A-dashboard-mobile, et tu me les montres avant de pousser.

Règles : français partout, jamais de tiret cadratin, mobile d'abord, vocabulaire de la section 6 du brief, polices auto-hébergées (pas Google Fonts), aucune migration de schéma hors supabase/migrations, aucun secret dans le code, build et lint qui passent avant chaque commit, docs/EN-COURS.md mis à jour à chaque étape, push sur main.
```
