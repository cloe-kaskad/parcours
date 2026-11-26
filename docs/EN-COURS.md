# En cours : reprise de la plateforme parcours (brief du 7 novembre 2026)

## État au 15 novembre 2026, fin de soirée

Aucun email n'est jamais parti vers une cliente. En ligne : https://parcours.amarecherche.fr. Tout le code est poussé sur main (dernier envoi de Cloé le 15 novembre au soir : vitesse et retour de la recherche). Les clientes n'ont pas encore accès à la plateforme (étape 5).

### Fait et en ligne
- Étapes 1 à 4 de la reconstruction, brief 04 (vue équipe, import du Drive), deux bornes du chemin, brief 06 points 1 à 3 : voir les sections plus bas.
- Chantier fluidité, temps 1 complet et vérifié en captures (design/captures-fluidite) : Avant la séance en cartes, agenda à une action par ligne, sélecteur de cliente dans l'en-tête, vue équipe compacte, « dater et nommer à la suite », liseuse à onglets, accès directs et lettre côté cliente, textes et liens à 14 px au moins.
- Règle 0b : cartes blanches bordées, beige réservé aux petits éléments, emails compris.
- Temps 2 complet : résumé de séance, chercher (une cliente ou toutes), ⌘K, mode en séance, épingler une phrase, fil Cloé et Émilien, remarque d'Émilien sous un exercice, mots qui reviennent, le fil, vocaux de la cliente, bilan de cycle en PDF.
- Migrations 0006 et 0007 appliquées par Cloé et vérifiées en base. Essais réels sur le compte de test « cloe » (séances d'essai effacées ensuite).
- Phrases clés et trois points proposés pour les 19 retours d'Émilien (lus un par un, contrôlés), en attente de validation.
- Recherche : retour visible sur ordinateur et sur téléphone, un seul retour du navigateur pour sortir.
- Vitesse (docs/08-diagnostic-vitesse.md) : région Dublin (vercel.json), requêtes groupées, connexion vérifiée sans appel réseau, fichiers signés à l'ouverture, agenda allégé. En production, vérifié le 15 novembre au soir (pages calculées à Dublin, en-tête cdg1::dub1) : vue équipe 5,2 s devenue 0,8 s, Avant la séance 5,1 s devenue 0,6 s, agenda 2,1 s devenu 0,4 s.

### En cours
- Premier essai réel de transcription Deepgram d'une séance : pas encore eu lieu (au prochain audio d'une séance sans transcript).
- Brief 06, pas encore faits : l'email « elle a écrit » à Cloé (point 4), le connecteur MCP (point 5, plan montré, attend validation).

### À vérifier par Cloé sur le site
- Les nouveaux écrans, sur téléphone et ordinateur : Avant la séance, agenda, vue équipe, dater et nommer, la liseuse et ses onglets, la recherche et son retour.
- La vitesse ressentie après le déploiement.
- Un vocal enregistré depuis un vrai téléphone sur le compte de test (essayé seulement avec un micro simulé, donc sans texte transcrit).
- ⌘K au clavier sur ordinateur (affiché, pas essayé au clavier).
- Le bouton « proposer depuis le transcript » et les résumés de séance : ils ne marchent que si ANTHROPIC_API_KEY est bien remplie dans Vercel.

### Attend une décision ou une action de Cloé
- Valider ou corriger les 19 phrases clés proposées (carte du retour d'Émilien, « Avant la séance »). Aucune n'est validée.
- Retours à regarder, signalés à la lecture : Déborah 5 semble coupé ; l'en-tête de Déborah 9 dit « Flora 9 » ; Vanessa 2 contient un « plan d'accompagnement » qui ne ressemble pas à Émilien, avec du vocabulaire médical ; « Débo » dans Vanessa 4 et « Flora » dans Vanessa 5.
- Valider les versions lisibles des 17 autres retours (dans apercus/, hors du dépôt ; 2 seulement sont en base).
- Mots et stations encore à valider : Vanessa 1 à 6, Sarah 1 à 3, Flora 1 et 2 (écran « dater et nommer à la suite » depuis chaque fiche). Vérifié en base le 16 novembre pour Vanessa : les six propositions sont là (mots_proposes, station_proposee), rien de validé. La fiche ne montrait que les mots validés : corrigé, les propositions s'affichent marquées « proposés ». Flora 2 n'a pas de date. Déborah est complète.
- Résumés des séances passées : aucun pour l'instant (bouton « proposer depuis le transcript », séance par séance, si la clé Anthropic est en place).
- Le compte de test « cloe » garde une « Lettre d'essai » et une note d'essai, créées pour les captures : à garder ou à effacer.
- Planches de Claude Design dans design/ecrans (modifiées et nouvelles) et deux scripts temporaires (scripts/.ecrire-lisibles.mts, scripts/.verif-lisible.mts) : jamais commités, à garder ou non.
- Valider le plan de sécurité du connecteur MCP (brief 06, point 5).
- Quand l'email « transcript prêt » doit repartir vers Émilien (réglage PREVENIR_EMILIEN).
- Essai d'Émilien pour Déborah : l'importer seulement si elle l'a déjà reçu. Celui de Vanessa n'existe qu'en Word.
- Sarah, séance 1 : la fin du transcript n'a pas pu être lue.
- Retirer la phrase d'outil au début du transcript de la séance 10 de Déborah (« Compris. Je formatte… »), avec « corriger ».
- Supprimer les entrées de carnet de Flora et Sarah qui ne contiennent que la consigne de Notion (effacement définitif).
- Extraire le texte des 12 transcripts migrés, qui n'existent qu'en PDF (ils ne sont pas trouvés par la recherche ni comptés dans les mots qui reviennent).
- Vérifier si les pages Notion de Vanessa, Flora et Sarah ont changé depuis l'export du 7 novembre.
- Fournir la banque de dix couvertures.
- Autoriser Google Drive, pour que l'audio déposé dans le dossier d'une cliente lance la transcription tout seul.
- Feu vert pour l'étape 5 (rappels J-3 et retards, événement Google Agenda à J+7, ouverture aux clientes, résiliation de Notion).

### Décisions déjà prises
- Le transcript est visible par la cliente dès qu'il est prêt, sans relecture préalable (Cloé, 10 novembre).
- Transcription : Deepgram, plutôt que le serveur Hostinger.
- Temps 2 fait dans l'ordre du plan (Cloé, 15 novembre) ; vitesse : les cinq pistes, dans l'ordre (Cloé, 15 novembre).
- La voix de la cliente est en carte blanche à filet rose (règle 0b), pas en beige comme sur la planche trois-voix.

## 1. Mise en place sur le Mac
- [x] Cloner le repo dans ~/Documents/Claude/parcours (clonage interrompu, terminé par Claude)
- [x] npm install (cache npm abîmé par des installations simultanées : installé avec un cache neuf)
- [x] ~~Doppler~~ abandonné (consigne de Cloé) : variables de Vercel récupérées dans .env.local (vercel env pull), CLAUDE.md et README mis à jour
- [x] Clé SUPABASE_SERVICE_ROLE_KEY passée en non sensible dans Vercel par Cloé, format eyJ vérifié
- [x] scripts/clientes.json rempli par Cloé (espace en trop dans l'email de Sarah, nettoyé par le script)
- [x] Export Notion décompressé dans ~/Downloads (Export-e23d7e7e-…)

## Première tâche : migration Notion
- [x] 1. Emails dans scripts/clientes.json, export dans ~/Downloads
- [x] 2. Lecture à blanc (--dry), résumé montré à Cloé, corrections du script validées par Cloé
- [x] 3. Migration réelle (Déborah réimportée avec --force après une coupure réseau), vérification en base : parcours, séances, exercices, ressources, journal, feedback présents pour les 4
- [x] 4. Liste de ce qui reste à saisir à la main (ci-dessous)

### À saisir à la main sur la plateforme
- [ ] Dates des 15 séances (aucune date dans Notion)
- [ ] Déborah, séance 3 : renommer « Exercice 1 » et « Exercice 2 »
- [ ] Vanessa, avril : renommer « Exercice 1 », « Exercice 2 », « Exercice Bonus »
- [ ] Vanessa : rattacher les envois Avril, Mai, Juillet, Août, Octobre à leur séance (aucun numéro dans Notion)
- [ ] Déborah, séance 5 : le « petit bonus du week-end » est resté dans le mot d'accompagnement
- [ ] Déborah (prochaine séance renumérotée de 11 à 10, fait) : séance 9 créée vide (exercices des séances 9 et 10, mais 7 séances dans Notion), et « Pour la séance 10 » rattaché à la séance 9 : vérifier la numérotation
- [ ] Flora et Sarah : leur seule entrée de carnet est la consigne de Notion (« Note ici, quand tu veux… », « Journal libre »), à supprimer si Cloé le souhaite
- [ ] Séances migrées : le texte n'existe qu'en PDF, à extraire si Cloé veut les relire comme un texte
- [ ] Photos déposées par les clientes dans Notion : non migrées
- [ ] Déborah : retirer la majuscule de « Pour La séance 10 »
- [ ] Bibliothèque : renommer le PDF « IIA480 Un entretien avec Paul Ricoeur fusion PDF »
- [ ] Déborah : relire l'intention affichée dans son Chemin (mot « dissociation »)
- [x] Base de données : fin de la migration 0002 appliquée avec la 0003

## Ensuite (sans coder)
- [x] Captures mobile (390 px) et desktop : Aujourd'hui, Chemin, Exercices (cliente) ; À faire, fiche cliente, page séance (Cloé)
- [x] Revue design et UX classée par impact, validée par Cloé (les 12 points, à condition qu'aucun email ne parte vers les clientes)

## Revue design : les 12 changements validés
- [x] 1. Météo du jour : remettre les sept mots en base
- [x] 2. Bouton « Lui envoyer son lien d'accès » : déplacé dans Compte, avec confirmation
- [x] 3. Plus de dates inventées (envois migrés, « transmis le 7 nov. »)
- [x] 4. Page Exercices : dernier envoi ouvert, anciens repliés, exercices repliables
- [x] 5. Chemin : afficher les séances vécues en attendant étapes et mots clés
- [x] 6. Rappels limités aux séances postérieures à l'ouverture
- [x] 7. Fiche cliente : plus de débordement, découpage en sections
- [x] 8. Titres bruts corrigés à l'affichage
- [x] 9. Retirer « 0/3 avec une réponse »
- [x] 10. Liste des séances : pas de coupure, pastilles expliquées, compteur sans séances vides, compte de test hors liste
- [x] 11. Menu de l'espace Cloé sur téléphone
- [x] 12. Largeur des textes sur ordinateur, champ Durée aligné

## Reconstruction à partir des maquettes (docs/03-brief-construction.md, 9 novembre 2026)
Remplace l'ancienne liste « Plus tard ». Règles : français partout, jamais de tiret cadratin, mobile d'abord, vocabulaire de la section 6, polices auto-hébergées, aucune migration hors supabase/migrations, aucun secret dans le code, build et lint avant chaque commit, ce fichier à jour à chaque étape, push sur main. Toujours aucun email aux clientes sans accord de Cloé.

### Étape 1 : socle visuel et page d'accueil cliente
- [x] Lire CLAUDE.md, les briefs 03, 01, 02, design/README.md, EN-COURS.md et les planches principes, composants-espace-cliente, A-dashboard-mobile
- [x] Proposer, sans coder, les jetons, les composants et la migration 0003 (SQL complet, testé sur une base temporaire)
- [x] Validation de Cloé (jetons, composants, migration, trois questions : séance 11 de Déborah renumérotée 10, italique selon les maquettes, « Ma préparation » dans une table à part)
- [x] Migration 0003 dans supabase/migrations et appliquée en production par Cloé (SQL Editor), vérifiée
- [x] Types mis à jour dans src/lib/supabase/types.ts
- [x] Jetons de design dans globals.css (palette, grain, typographies, rayons, espacements)
- [x] Composants : Papier, Pastille météo, Carte ressource (3 états), Carte séance, Entrée de carnet, Geste Écrire (3 états), Encadré « Pourquoi ça compte », Tracé du chemin
- [x] /espace : les huit zones de la planche A, données réelles de Déborah, couverture par défaut copiée dans le bucket
- [x] /connexion refaite selon F
- [x] Barre d'onglets et anciennes pages cliente supprimées (page provisoire /espace/bientot jusqu'à l'étape 2)
- [x] Captures mobile 390 px à côté de la planche A, montrées à Cloé avant de pousser
- [x] Carnets : en-tête et consigne venus de Notion retirés (Déborah, Vanessa, Flora, Sarah)
- [x] Build et lint, commit, push sur main
- [x] Validation de Cloé sur le vrai site (« Oui, étape 2 »)

### Étapes suivantes (chacune validée sur le vrai site avant la suivante)
- [x] Étape 2 : lire et écrire (planches B, C, D, E), reconstitution des lettres
  - [x] /espace/lettre/[id] : lettre en pleine page depuis le Markdown, exercices dérivés des titres, Écrire sous chaque exercice et en fin de lettre, notes dans journal
  - [x] /espace/carnet : carnet complet, écriture sur place, marqueur « à aborder en séance »
  - [x] /espace/seance/[id] : transcript en texte courant, prises de parole quand disponibles, sinon le Markdown (les 12 séances migrées n'ont qu'un PDF : lien vers le document en attendant)
  - [x] /espace/ressources : médiathèque, filtres, suivi en un geste, lien externe
  - [x] Lettres existantes reconstituées (contenu), rendu vérifié pour Déborah
  - [x] Captures 390 px à côté des planches, build, lint, commit, push
  - [x] Validation de Cloé sur le vrai site (« Oui, étape 3 »)
- [x] Étape 3 : l'espace de Cloé (planches H à N, composants-espace-cloe), dates des séances
  - [x] /coach : l'agenda, états calculés, retards seulement après l'ouverture de la plateforme
  - [x] Saisie rapide des dates des séances migrées (agenda ou fiche)
  - [x] /coach/clientes/[id] : la fiche, dashboard cliente avec Outils au-dessus de chaque zone, formulaires en place
  - [x] /coach/clientes/[id]/seances/[id] : fil en quatre temps, dépôt d'audio direct vers Storage, lecteur, mots et station à valider
  - [x] /coach/clientes/[id]/lettre/[id] : éditeur un seul bloc, aperçu, collage conservé, volet sources, Envoyer, texte WhatsApp
  - [x] /coach/clientes/[id]/seances/[id]/avant : Avant la séance, Ma préparation (Cloé seule)
  - [x] /coach/ressources : coller un lien, /api/lien, carte à valider, partager
  - [x] /coach/clientes/nouvelle : création avec couverture et dossier Drive
  - [x] Note d'Émilien déposée dans la mémoire de la cliente
  - [x] Anciens composants et styles de l'espace Cloé retirés
  - [x] Captures 390 px à côté des planches, build, lint, commit, push
  - [x] Validation de Cloé sur le vrai site (« Oui, étape 4 »)
  - [ ] Banque de dix vraies couvertures à fournir par Cloé (cinq images des maquettes en attendant, dont quatre trop petites)
- [ ] Étape 4 : l'espace d'Émilien et la chaîne transcription (planches O, P, emails)
  - [x] /emilien : « À lire », « Déjà traitées » replié
  - [x] /emilien/seances/[id] : lecteur (vitesse, position mémorisée), transcript, « Mon retour », ressource à proposer, « Envoyer à Cloé »
  - [x] Modèles d'emails : retour d'Émilien (à Cloé), transcript prêt (à Émilien)
  - [x] Email à Cloé quand Émilien envoie son retour (à essayer en ligne : la clé Resend n'est pas lisible en local)
  - [x] Choix du service de transcription : Deepgram (décision de Cloé)
  - [x] Transcription depuis un dépôt manuel : écrite, testée avec un faux retour de Deepgram, en ligne
  - [x] Clé DEEPGRAM_API_KEY dans Vercel et redéploiement (Cloé)
  - [ ] Premier essai avec un vrai audio, sur le compte de test (Cloé)
  - [x] Après transcription : Markdown et segments, PDF, trois mots et une station, email, emilien_notifie_at (écrit et testé avec un faux retour ; la reconnaissance des voix par Claude et l'email n'ont pas encore tourné pour de vrai)
  - [ ] Email « transcript prêt » envoyé à Cloé pendant les essais (PREVENIR_EMILIEN à false) : à rebasculer vers Émilien quand Cloé le décide
  - [x] Transcript visible par la cliente dès qu'il est prêt (décision de Cloé, 10 novembre)
  - [ ] Dossier Drive relié : attend l'autorisation Google de Cloé
- [ ] Étape 5 : rappels et ouverture, police et résiliation de Notion

## Fiche cliente en vue équipe (docs/04-fiche-cliente-vue-equipe.md, 10 novembre 2026)
Règles : français, jamais de tiret cadratin, mobile d'abord, aucun email aux clientes, build et lint avant chaque commit, ce fichier à jour.
- [ ] 1. Bouton « Se déconnecter » (en-tête espace Cloé et espace Émilien, pied de l'espace cliente) et hauteur de couverture (section 2, point 3) sur le dashboard cliente et la fiche ; push, vérification de Cloé sur le site
  - [x] Code poussé : « Se déconnecter » dans l'en-tête de l'agenda, d'« À lire », de toutes les pages à bandeau violet et de la fiche, dans le bandeau ordinateur et le pied de l'espace cliente ; couverture bornée à 55 % de l'écran (60 % sur ordinateur) et assez basse pour laisser voir le chemin et le haut du bloc suivant
  - [x] Vérifiée en local à 390 px sur « Voir comme elle » : chemin entier, bloc suivant visible
  - [ ] Vérifiée par Cloé sur le site
- [x] 2. Migration 0004 (section 4) : SQL complet montré à Cloé avant application, avec la vérification que la cliente ne peut jamais lire note_equipe
  - [x] supabase/migrations/0004_vue_equipe.sql écrite et testée sur une base temporaire (0001 à 0004) : la cliente ne lit, n'écrit, ne modifie ni ne supprime rien dans parcours_notes_equipe ; Émilien et Cloé lisent et écrivent ; bucket preparations réservé à Cloé
  - [x] Validée par Cloé (bucket preparations réservé à Cloé compris)
  - [x] Appliquée en production par Cloé dans SQL Editor (SUPABASE_DB_PASSWORD est vide dans .env.local, variable sensible de Vercel), vérifiée par Claude : table, colonnes et buckets présents
  - [x] Types mis à jour dans src/lib/supabase/types.ts
- [x] 3. Script scripts/importer-drive.ts (section 2, point 5) : chemin du dossier Drive demandé à Cloé, lecture à blanc (fichier → cliente → séance), arbitrage de Cloé, puis import réel
  - [x] Script écrit (reconnaissance par le nom, lecture à blanc, arbitrages dans scripts/drive-corrections.json gitignoré, rien n'est écrasé), essayé sur le premier zip (2 fichiers)
  - [x] Lecture à blanc complète (158 fichiers), arbitrages validés par Cloé le 11 novembre (« tout valider »)
  - [x] Numérotation alignée sur le Drive : Déborah, séances 8 et 10 créées (vécues), la séance du 16 novembre devient la 11 ; Vanessa, séances 4, 5 et 6 créées, la séance du 16 novembre devient la 7 ; la 3bis de Vanessa ajoutée à la séance 3 comme seconde partie
  - [x] Import réel : 55 fichiers (Déborah 26, Flora 4, Sarah 7, Vanessa 18), aucun échec ; relancé à blanc : plus rien à importer
  - [ ] Laissés de côté : audios, dossiers Céline, Eva, Juliette, Kevin, Rania (pas de compte), atelier Covivio et documents de travail, notes d'Émilien (essai de Déborah à importer seulement si elle l'a déjà reçu ; celle de Vanessa n'existe qu'en Word)
  - [ ] Séances 8 et 10 de Déborah, 4 à 6 de Vanessa : sans date (bouton « dater » sur la fiche)
  - [x] Dépôt d'audio : .m4a sélectionnables, envoi par morceaux de 6 Mo avec pourcentage et reprise après coupure, transcript existant gardé, fichier de plus de 50 Mo signalé tout de suite (plafond du stockage Supabase, vérifié le 11 novembre)
  - [x] Audios de plus de 45 Mo allégés automatiquement dans le navigateur avant l'envoi (option 2 choisie par Cloé le 11 novembre) : voix mono AAC 48 kb/s, testé en local sur un faux audio de 79 Mo et 1 h 14, ramené à 28 Mo en 64 s ; sur téléphone, non vérifié
  - [x] Dépôt de l'audio de la séance 10 de Déborah par Cloé sur le site (11 novembre) : allégé à 28 Mo, 1 h 14, transcript du Drive gardé, vérifié en base
  - [x] Mots et station proposés pour les 20 séances passées qui ont un transcript (Déborah 1 à 10, Flora 1, Sarah 1 à 3, Vanessa 1 à 6), lus par Claude dans les transcripts et les retours d'Émilien, enregistrés comme propositions (la clé Anthropic n'est pas lisible en local) ; Sarah 1 : fin du transcript non lue
  - [ ] Validation des mots et stations par Cloé sur chaque fiche (le chemin se dessine avec les validés)
  - [x] Bouton « proposer depuis le transcript » dans l'encadré des mots de chaque séance (transcript collé, importé ou transcrit) ; testé en local sans clé (message clair, rien modifié)
  - [ ] Bouton à essayer en ligne par Cloé (dépend de ANTHROPIC_API_KEY dans Vercel)
- [x] 4. Vue équipe (section 3) sur /coach/clientes/[id], fiche actuelle déplacée sur /coach/clientes/[id]/espace derrière « Voir comme elle » ; Émilien sans la préparation ni les outils d'écriture de Cloé ; captures 390 px avant de pousser
  - [x] Construite en local (build et lint passent) : bandeau, il reste à faire, où elle en est (note de parcours), séances dépliables avec audio, transcript, retour, préparation, notes d'Émilien, carnet, ressources, compte ; ancienne fiche déplacée sur /coach/clientes/[id]/espace (carnet complet)
  - [x] Captures 390 px faites en local, vue de Cloé et vue d'Émilien (session locale ouverte avec l'accord de Cloé) : ni préparation ni outils de Cloé côté Émilien, « Écrire mon retour » présent ; corrigés : « Nouvelle séance » illisible sur le bandeau, bouton du lien d'accès illisible sur papier, séance ouverte par défaut = dernière vécue
  - [x] Planche I v2 de Claude Design (téléphone, ordinateur, Émilien) appliquée au dessin : bandeau violet et boutons ronds, note dans un encadré beige, objets de séance encadrés, mots validés en pastilles, mots à poser sur une ligne, ressources avec vignette et suivi ; captures 390 px vue de Cloé et vue d'Émilien
  - [ ] Vérification de Cloé sur le site

## Deux bornes de temps sous le chemin (design/ecrans/chemin-deux-bornes.dc.html, piste B, 12 novembre 2026)
- [x] Sous la première station, la date de début (« mars 2026 », Libre Baskerville italique, rose) ; vers le point vide, « aujourd'hui » (crème) ; rien entre les deux ; espacement des stations inchangé
- [x] Partout où le chemin apparaît : dashboard cliente, vue équipe, « Voir comme elle », téléphone et ordinateur ; place des bornes réservée, aucun mot de station ne les chevauche ; sur la vue équipe, le chemin s'affiche entier dans sa carte, « modifier le chemin » sous la carte
- [x] Date de début : parcours.date_debut existait déjà (migration 0001), pas de nouvelle migration ; sinon la plus ancienne séance datée, sinon pas de borne de départ
- [x] Date de début modifiable dans la vue équipe, à côté de « modifier » l'intention
- [x] Déborah : 1er mars 2026 (jour à corriger par Cloé)
- [x] Captures 390 px et 1280 px de « Voir comme elle » (même dessin que son dashboard, pas de session au nom de Déborah) et de sa vue équipe, build, lint
- [x] Commit et push (f53547e)
- [ ] Vérification de Cloé sur le site

## Lire, écrire, préparer (docs/06-lecture-ecriture-preparation.md, 12 novembre 2026)
Règles : français, jamais de tiret cadratin, mobile d'abord, aucun email aux clientes, build et lint avant chaque commit, ce fichier à jour.
- [x] 1. Lecture (2.1) : un seul composant de lecture (DM Sans droit, 17 px, interligne 1.65, encre, colonne de 66 caractères, Markdown) pour le retour d'Émilien, le transcript, la lettre, la préparation et la note de parcours ; plus d'italique sur les textes longs ; geste « Lire » en pleine page (Échap ou « Fermer », position de lecture gardée) ; retours du Drive mis en forme à l'affichage (ligne de titre retirée, tirets en séparation, « Niki : » en gras, aucun mot changé)
  - [x] « Avant la séance » dans le nouvel ordre : ce qu'elle veut aborder, la lettre avec ce qu'elle a écrit, le retour d'Émilien, le reste du carnet, météos, ressources, transcript, préparation
  - [x] Vue équipe : retour d'Émilien et préparation sur toute la largeur de la séance
  - [x] Captures 390 px et 1280 px (« Avant la séance » de Déborah, séance 11, et sa vue équipe), build, lint
  - [ ] Vérification de Cloé sur le site
- [x] 2. Notes de la cliente sous chaque exercice de la lettre côté équipe, note de fin de lettre en bas, « Elle n'a rien écrit sous cette lettre » ; voix de la cliente (bloc beige, filet rose, « Déborah a écrit » et la date) sur « Avant la séance » et dans le carnet de la vue équipe ; « Copier le dossier pour Claude » (Markdown, toutes les sections du 2.4) ; « Ma préparation » se lit, « Modifier » ouvre l'édition
  - [x] Marque « a écrit » sur l'agenda et la fiche (vérifiée en local à 390 px et sur ordinateur)
  - [ ] Côté cliente : la phrase « ce que tu écris, Cloé le lit avant la séance » dans la lettre
- [x] 2.2 Lettre de la séance 11 de Déborah : enregistrée en base le 15 novembre par Claude (« Pour la séance 11 », rattachée à la séance 10, trois exercices : Ce que tu ferais, Le carnet, Les trois regards), visible par Déborah, aucun email parti ; ses réponses à l'exercice 1 enregistrées comme sa note sous cet exercice (marquée vue)
- [ ] Vérifier si les pages Notion de Vanessa, Flora et Sarah ont changé depuis l'export du 7 novembre
- [x] 3. Migration 0005 (`retours.contenu_lisible`, `journal.vu_par_coach_at`, `acces_mcp`) et version lisible de deux retours : à montrer à Cloé avant d'appliquer
  - [x] supabase/migrations/0005_lecture_preparation.sql écrite (pas encore commitée) et testée sur une base temporaire : la cliente ne lit ni retours ni acces_mcp, ne peut ni poser ni garder la marque « vu », Émilien ne peut pas la poser, acces_mcp ni modifiable ni effaçable, lu par Cloé seule
  - [x] Contrôle « mêmes mots, même ordre » écrit (`memesMots`, src/lib/retour.ts) et essayé : il refuse un mot changé ou une phrase retirée
  - [x] Versions lisibles de Déborah 2 et Vanessa 1 dans apercus/ (non commité, données de séance), contrôle passé
  - [x] Validée par Cloé le 12 novembre (SQL et les deux versions lisibles)
  - [x] Appliquée par Cloé dans SQL Editor le 12 novembre, vérifiée : colonnes, table acces_mcp vide et fermée aux anonymes, fonction marquer_carnet_vu refusée aux anonymes
  - [x] Remarque : la ligne « ce qui est déjà écrit compte comme vu » a été annulée par le garde-fou (dans SQL Editor, personne n'est reconnu comme Cloé). Les 4 notes de début de parcours ont été marquées vues en ouvrant les quatre fiches en local avec le compte de Cloé. Effet de bord : leur date de modification est passée au 12 novembre ; la marque affiche donc le jour d'écriture (`journal.date`)
  - [x] Poussé : types, version lisible affichée avec « Voir le texte d'origine », marque « a écrit » (pastille rose) sur l'agenda et la fiche, « nouveau » sur les textes non vus, la marque tombe quand Cloé ouvre la fiche ou « Avant la séance »
  - [x] Versions lisibles de Déborah 2 et Vanessa 1 enregistrées en base (contrôle « mêmes mots » passé), affichées avec « Voir le texte d'origine »
  - [x] Les 17 autres retours : versions lisibles faites le 12 novembre (dans apercus/, non commité), contrôle passé pour les 19 ; contrôle corrigé pour accepter les numéros d'Émilien en début de ligne (« 2) »)
  - [ ] Validation de Cloé, puis enregistrement en base (script prêt)
  - Remarque : la première moitié du retour Vanessa 2 reprend mot pour mot le retour Vanessa 1 (doublon probable de l'import du Drive)
- [x] 4. Email « elle a écrit » (essai sur le compte de test)
- [x] 5. Connecteur MCP : plan de sécurité montré à Cloé le 12 novembre, sans coder ; attend sa validation
- [ ] 6. Reprise au dessin quand les planches de Claude Design arrivent
- Remarque : le transcript de la séance 10 de Déborah commence par une phrase d'outil (« Compris. Je formatte en reconstituant… »), restée du Drive ; à retirer par « corriger » si Cloé le souhaite

## Papier uni (demande de Cloé, 15 novembre 2026)
- [x] Grain de fond retiré partout : la classe papier est maintenant un aplat #FAF6EF, image grain.png supprimée. Le tracé du chemin n'avait pas de grain (sa « graine » est le hasard qui fixe la forme du dessin, gardée).

## Chantier fluidité (validé par Cloé le 15 novembre 2026)
Maquettes dans design/ecrans, elles priment pour le dessin : L-v3-avant-la-seance (mobile, desktop), H-v2-agenda (mobile, desktop), I-v3-vue-equipe (mobile, desktop, emilien-mobile), dater-et-nommer-a-la-suite, lire-2-ouvert-telephone, lire-3-ouvert-ordinateur, A-dashboard et B-lettre (mobile, desktop), temps-2-dix-evolutions. Les textes d'exemple des maquettes sont inventés : rien en base. Après chaque étape : captures 390 px et 1280 px dans design/captures-fluidite, build, lint, ce fichier à jour, push.
- [x] 0. Retirer le grain de fond partout (globals.css, TraceChemin et les pages qui l'utilisent) : papier uni #FAF6EF (déjà fait le 15 novembre, commit 97652c6, vérifié : plus aucune image de fond dans src ; la « graine » de TraceChemin est le hasard du dessin, pas un grain)
- [x] 0b. Couleur des blocs (ajout du brief, 15 novembre au soir) : fond de page papier #FAF6EF ; toute carte de lecture ou d'écriture blanche #FFFFFF, bordure 1px rgba(89,17,77,.14), sans ombre (voix de la cliente avec filet rose à gauche, Ma préparation avec filet rouge en haut, lettre, transcript, météos, ressources, note de parcours, zones d'écriture et champs longs, volet de sources, emails) ; beige #E8DDD0 seulement pour de petits éléments (Pourquoi ça compte, bandeau d'une ligne, petit lecteur, pastilles, extraits d'une ou deux lignes), jamais pour un bloc de plus de trois lignes ni deux blocs beiges côte à côte ; seuls aplats : retour d'Émilien (violet nuit) et compteur du carnet (rose) ; en faire des jetons dans globals.css et remplacer les usages
  - [x] Jetons --carte (#FFFFFF) et --carte-filet (rgba 89,17,77 / .14) et classe carte-blanche dans globals.css ; passés en blanc bordé : voix de la cliente (filet rose), Ma préparation (filet rouge), lettre, transcript, météos, ressources, note de parcours, zones d'écriture côté cliente, champs longs, volet de sources, bloc des trois mots, « Pour te souvenir », cartes de l'espace cliente (lettre, carnet, ressources), emails (fond papier, carte blanche). Restent en beige : Pourquoi ça compte, bandeau « à dater et nommer », petit lecteur, extraits de deux lignes, vignettes vides. Vérifié sur les captures 390 et 1280 px (commit local)
  - Remarque : le brief recollé le 15 novembre au soir s'arrête au milieu du point 4 ; la suite (points 5 à 7, temps 2) est supposée inchangée
### Temps 1, dans cet ordre
- [x] 1. Avant la séance : une carte par contenu (Ma préparation beige à filet rouge en tête, fixe à gauche sur ordinateur ; Ce qu'elle veut aborder avec compteur rouge et voix de la cliente ; La lettre à bandeau violet, une ligne par exercice avec pastille pleine ou vide et extrait de sa note ; Retour d'Émilien en carte violet nuit, phrase clé, trois points, « Lire en entier » ; Météos en pastilles ; Reste du carnet en carte rose avec compteur ; Ressources avec vignettes et état ; Transcript avec lecteur, trois mots, « Lire »). Barre de sections collante sur téléphone, grille sur ordinateur. « Copier le dossier pour Claude » et « Mode en séance » en bas sur téléphone, en haut à droite sur ordinateur (« Mode en séance » : bouton présent, écran au temps 2)
  - [x] Codé (commit local 3cdffae), build et lint : cartes selon L v3, préparation fixe à gauche sur ordinateur, barre de sections collante (téléphone), liseuse à onglets, « Mode en séance » présent (annonce le temps 2)
  - [x] Migration 0006 : retours.phrase_cle (text) et retours.points_cles (text[], trois au plus), proposés depuis le retour puis validés par Cloé ou Émilien (même mécanique que les trois mots) ; tant qu'ils sont vides, les premières lignes du retour. Montrée à Cloé avant application
    - [x] supabase/migrations/0006_phrase_cle.sql écrite et testée sur une base temporaire (0001 à 0006) : quatre points refusés, la cliente ne lit ni n'écrit rien, la proposition s'efface quand Émilien réécrit son retour, la version validée reste. Ajout par rapport au brief : deux colonnes de proposition (phrase_cle_proposee, points_cles_proposes), nécessaires pour « proposé puis validé »
    - [x] Proposition automatique quand Émilien envoie son retour, bouton « Proposer la phrase clé » sur la carte, « Valider » et « Corriger » (Cloé et Émilien) ; avant la migration, la carte montre le début du retour et aucun bouton
    - [x] Validation de Cloé, puis application dans SQL Editor (15 novembre)
    - [x] Propositions pour les 19 retours existants (15 novembre) : lues par Claude dans chaque retour, contrôlées (phrase de 15 mots au plus, trois points de 12 mots au plus, pas de tiret cadratin), enregistrées comme propositions, rien de validé. À valider ou corriger par Cloé ou Émilien sur la carte du retour (« Avant la séance »)
    - Signalé à la lecture : Déborah 5 semble coupé (finit par un titre isolé) ; l'en-tête de Déborah 9 dit « Flora 9 » ; Vanessa 2 reprend Vanessa 1 puis contient un « plan d'accompagnement » adressé à Vanessa, avec du vocabulaire médical, qui ne ressemble pas à Émilien ; « Débo » apparaît dans Vanessa 4 et « Flora » dans Vanessa 5 ; Déborah 10 : la prudence d'Émilien sur une scène très sensible est reprise en termes neutres
  - [x] Captures 390 px et 1280 px (design/captures-fluidite/1-*), session locale ouverte avec l'accord de Cloé le 15 novembre. Corrigés après captures : la page plantait (calcul du temps de lecture appelé côté serveur), la préparation de Cloé, longue, est repliée sur téléphone (« Lire en entier ») et défile dans sa colonne sur ordinateur, barre de sections et « Lire en entier » masqués sur ordinateur, carte des ressources élargie
  - [x] Liseuse vérifiée dans le navigateur : quatre onglets, « Suivant : le transcript », position de lecture retrouvée en revenant sur un onglet
  - [x] Push
- [x] 2. Agenda : une action par ligne selon l'état (Déposer, Écrire, Préparer), le prénom ouvre la fiche ; sélecteur de cliente dans l'en-tête de tout l'espace équipe
  - [x] Codé (commit local d79ee7f), build et lint : Déposer (transcript manquant), Écrire (lettre à écrire, ouvre l'éditeur), Préparer (séance à venir) ; un seul en-tête pour tout l'espace équipe, sélecteur avec prochaine séance, retards, pause et « a écrit » ; Bibliothèque, « Toutes les clientes » et « Se déconnecter » dans le sélecteur sur téléphone. « Chercher » et ⌘K des maquettes : temps 2
  - [x] Captures (2-agenda, 2-selecteur, 2-a-lire-emilien), push. Corrigés après captures : les séances reprises de Notion n'ont plus de bouton (« reprise de Notion » et leurs points), « Passées » est replié, une séance depuis l'ouverture qui attend encore quelque chose reste dans « Il reste à faire » ; « pas de séance prévue » dans le sélecteur
- [x] 3. Vue équipe : en-tête compact sans couverture, barre de sections collante, tout replié par défaut avec compteurs, dernière séance en résumé avec accès directs, états vides sur une ligne, chemin à 120 px, intention en texte droit sur une ligne, un seul bandeau pour les séances à dater et nommer ; sur ordinateur, séances et carnet à gauche, le reste dans une colonne fixe à droite ; vue d'Émilien selon sa maquette, sa version ordinateur déduite de celle de Cloé
  - [x] Codé (commit local faa1543), build et lint. Les détails de chaque séance (dépôts, coller le transcript, mots à poser, écrire la lettre) restent sur la page de la séance, à un geste. Le résumé de séance des maquettes (cinq lignes) est le premier point du temps 2 : pas affiché en attendant
  - [x] Captures (3-vue-equipe, 3-vue-equipe-emilien), push. Corrigés : note de parcours vide sur une ligne (« Écrire »), titre « Les séances » qui passe à la ligne
- [x] 4. Écran « dater et nommer à la suite » : une séance après l'autre, propositions préremplies, « Valider et suivante », « passer » ; sur ordinateur, même écran en colonne centrée
  - [x] Codé (commit local faa1543) sur /coach/clientes/[id]/dater, depuis le bandeau de la vue équipe : date, trois mots, station, « proposer depuis le transcript », « Pour te souvenir » (phrase clé ou début du retour, sinon du transcript), « lire le transcript » dans la liseuse ; n'enlève pas la marque « a écrit »
  - [x] Captures (4-dater-et-nommer, sur Vanessa : Déborah n'a plus rien à dater ni à nommer), push. Corrigé : les trois mots l'un sous l'autre sur téléphone (un mot proposé long était coupé)
- [x] 5. Lire : onglets entre les textes d'une même séance, « Suivant » en bas, position gardée
  - [x] Codé (commits locaux 3cdffae et 00318ef) : Avant la séance, vue équipe (dernière séance), page séance, dater et nommer ; l'ancien geste « Lire » est retiré. Téléphone plein écran, ordinateur en feuille sur fond violet nuit
  - [x] Captures (1-liseuse, 5-seance), push
- [x] 6. Côté cliente : trois accès directs sous le chemin ; dans la lettre, barre collante (retour, « exercice n sur N ») et sommaire des exercices
  - [x] Codé (commit local 00318ef) : « Ta lettre », « Écrire », « Tes séances » ; barre collante sur téléphone, sommaire avec « tu as écrit », et la phrase de la planche B « Sous chaque exercice, tu peux écrire. Je lis tout avant notre séance. » (règle aussi la phrase côté cliente du brief 06)
  - [x] Captures de « Voir comme elle » (6-voir-comme-elle), où les trois accès sont ajoutés aussi ; push
  - [x] Lettre côté cliente vérifiée le 15 novembre sur le compte de test « cloe » (accord de Cloé), avec une « Lettre d'essai » au texte inventé créée sur ce compte inactif : barre collante, sommaire, « tu as écrit », « Tu as écrit · date », zones d'écriture visibles (captures 6-lettre-cliente, 6-espace-cliente)
  - [x] Planche ecrire-cote-cliente-mobile (citée dans le brief recollé) : sa note porte « Tu as écrit · date », la zone d'écriture au repos est visible (cadre en pointillés, « Écrire » en rouge à droite) au lieu d'un simple lien ; non vérifié en image, même raison
  - Planche trois-voix : la remarque d'Émilien sous chaque exercice (« Émilien · pour l'équipe ») est une fonction nouvelle avec une table en base, hors des points 1 à 7 ; ajoutée au plan du temps 2 (docs/07, point 11). Sa voix de la cliente en beige est remplacée par la règle 0b (blanc, filet rose)
- [x] 7. Partout : aucun lien sous 14 px, zones tactiles de 44 px, trois niveaux de texte seulement, titres de ressources nettoyés à l'import et modifiables
  - [x] Codé (commit local 00318ef) : textes et liens de 11 à 13 px passés à 14 px (restent plus petits : le mois du petit calendrier, les pastilles « a écrit », les surtitres en capitales des cartes), pilules et puces à 44 px ; titres : nom du site retiré à l'import (YouTube, France Culture, le site du lien…), déjà modifiables dans la bibliothèque. « Trois niveaux de texte » appliqué aux écrans refaits (titre, texte, mention à 14 px) ; pas de revue écran par écran du reste
  - [x] Vérifié sur les captures, push. Corrigé : le suivi « à découvrir / commencé / terminé » des ressources débordait de sa carte à 14 px (marges resserrées)
### Temps 2
- [x] Ne rien coder : lire temps-2-dix-evolutions et proposer à Cloé un plan (docs/07-plan-temps-2.md, montré le 15 novembre)
- Décision de Cloé (15 novembre) : « temps 2 fais tout dans l'ordre »
  - [x] Migration 0007 (résumés, notes en séance, épingles, échanges, vocaux) écrite et testée sur une base temporaire : la cliente ne lit ni résumés ni épingles ni échanges, n'y écrit rien ; Émilien n'écrit pas au nom de Cloé et Cloé ne modifie pas ses messages ; une cliente ne dépose et ne lit que ses vocaux
  - [x] Migrations 0006 puis 0007 appliquées par Cloé (15 novembre), vérifiées en base : colonnes de la phrase clé, tables seances_resumes, epingles, echanges, notes_seance, journal.audio_path, espace « vocaux » ; code poussé par Cloé, déploiement de production prêt, site qui répond
  - [x] Essais réels le 15 novembre sur le compte de test « cloe » (séances d'essai 901 et 902, texte inventé, effacées ensuite) : résumé validé, notes en séance enregistrées, phrase épinglée puis visible dans « Avant la séance », message de Cloé lu par Émilien et réponse d'Émilien, vocal enregistré (micro simulé) et rangé dans le carnet avec « Tu as dit » ; captures t2-1, t2-5, t2-6, t2-9
  - [x] 1. Résumé de séance : proposé avec les mots et la station par la même lecture du transcript (nouvelles transcriptions et bouton « proposer depuis le transcript »), table réservée à l'équipe, « Valider » ou « Corriger » par Cloé, affiché dans la vue équipe, « Avant la séance » et « dater et nommer ». À voir après 0007 et avec la clé Anthropic dans Vercel ; les 20 séances passées n'ont pas encore de résumé
  - [x] 2. Chercher : sans accents, dans les transcripts, carnets, retours et lettres, une cliente (« Chercher chez elle ») ou toutes (« Chercher » dans l'en-tête), extraits surlignés, aucune migration ; vérifié (« maman » : 142 passages ; « attali » chez Déborah)
  - [x] 3. Commande rapide ⌘K (ordinateur) : fiche, préparer la séance, dater et nommer, chercher chez elle, chercher partout ; affichée dans l'en-tête, non essayée au clavier dans les captures
  - [x] 4. Mode en séance : préparation, à aborder, notes avec chrono (Entrée : nouvelle ligne datée), enregistrées au fil de l'eau avec la préparation (Cloé seule) ; notes relisibles dans la vue équipe (« Mes notes ») ; capture faite, enregistrement à vérifier après 0007
  - [x] 5. Épingler une phrase : sélection dans la liseuse, « Épingler » ; dans « Avant la séance » (avec « retirer ») et le volet de sources de l'éditeur de lettre ; à vérifier après 0007
  - [x] 6. Cloé et Émilien par séance : fil sous le retour (page séance de Cloé, page de lecture d'Émilien) ; 11. remarque d'Émilien sous chaque exercice dans la liseuse d'« Avant la séance » (« pour l'équipe ») ; à vérifier après 0007. Pas de marque dans l'agenda pour l'instant
  - [x] 7. Mots qui reviennent (vue équipe) : mots posés sur les séances, présence séance par séance dans les transcripts ; vérifié
  - [x] 8. Le fil (vue équipe, en plus des sections) : moments depuis l'ouverture (carnet, météos, lettres, retours, séances) ; vérifié
  - [x] 9. Vocaux : bouton « Dire, plutôt qu'écrire » dans son carnet (une minute au plus), transcription Deepgram, entrée de carnet avec lecteur (« Tu as dit »), « a dit » côté équipe ; à essayer après 0007, depuis un téléphone, sur le compte de test
  - [x] 10. Bilan de cycle : page de Cloé (« Préparer » dans la vue équipe) et PDF ivoire et Lora (période, stations, intention, mots par séance, lettres, ce qu'elle a écrit) ; rien n'est envoyé ; vérifié (PDF de Déborah généré)
  - Captures du temps 2 dans design/captures-fluidite (t2-*). Compte de test « cloe » : une « Lettre d'essai » et une note d'essai créées pour les captures

### Où en est le chantier fluidité (15 novembre, fin de journée)
- Temps 1 codé, vérifié en captures (20 images dans design/captures-fluidite, vue de Cloé et vue d'Émilien), poussé sur main.
- Reste : la migration 0006 (validation de Cloé puis SQL Editor), les phrases clés des 19 retours, la lettre côté cliente à voir sur le site, la décision sur l'ordre du temps 2.

## Vitesse (15 novembre 2026)
- [x] Diagnostic mesuré (docs/08-diagnostic-vitesse.md) : pages calculées aux États-Unis (iad1) loin de la base en Irlande, 4 à 16 étapes de requêtes successives, connexion revérifiée jusqu'à 26 fois par page, 10 liens de fichiers signés d'avance, transcripts de toutes les clientes rechargés à chaque page (1,3 Mo)
- [x] 1. Région dub1 (vercel.json), effective au prochain déploiement
- [x] 2. Requêtes lancées ensemble (vue équipe, Avant la séance, en-tête)
- [x] 3. Connexion vérifiée sur place (getClaims)
- [x] 4. Fichiers signés à l'ouverture (/api/fichier)
- [x] 5. Agenda et sélecteur allégés
- [x] Mesure en production après déploiement : vue équipe 5,2 → 0,83 s, Avant la séance 5,1 → 0,65 s, À lire 2,9 → 0,56 s, lire une séance 2,6 → 0,36 s, chercher 2,8 → 0,88 s, bibliothèque 2,2 → 0,41 s, agenda 2,1 → 0,44 s, bilan 3,1 → 0,47 s
- [x] Chercher chez elle : retour visible aussi sur ordinateur (et sur toutes les pages de l'équipe), recherches sans empiler l'historique, prénom affiché avant la première recherche

## Mode en séance, reprise complète (brief de Cloé, 15 novembre 2026)
Référence visuelle : design/ecrans/mode-en-seance-desktop.dc.html (texte d'exemple, rien en base). Codé le 15 novembre au soir, poussé ; migration 0008 validée et appliquée par Cloé le 16 novembre, vérifiée en base (trois colonnes présentes, rien de lisible sans connexion).
- [x] 1. Équilibre de l'écran : ordinateur en trois colonnes (repère 150 px à pastilles, préparation large, notes 300 px fixes) ; téléphone : préparation pleine largeur, notes en volet bas ; en-tête : prénom et séance, « Version séance » / « Préparation complète », chronomètre, « Quitter »
- [x] 2. « Version séance » par défaut : allégée de 30 à 40 % (refus si moins de 60 % de la longueur, hors blocs intégraux), mêmes sections dans le même ordre, paragraphes DM Sans 19 px, phrases clés en gras, questions en League Spartan 23 px à filet rouge, cartes à bandeau de couleur (rouge, violet, rose, violet nuit, puis on recommence, dernière en beige), numéro, titre 30 px, durée, bouton « fait »
- [x] 3. Textes à lire mot pour mot : jamais coupés (titres « visualisation », « à lire », « texte guidé », « script », ou marque « Texte à lire en entier » dans les deux éditeurs), contrôle memesMots sur chaque bloc, replié sur une ligne et ouvert dans Lire en pleine page (DM Sans 20 px, interligne 1.7), même marque dans « Préparation complète »
- [x] 4. Données (migration 0008 appliquée par Cloé le 16 novembre, vérifiée) : seances_preparations.version_seance (jsonb), « Proposer la version séance » sur « Avant la séance » (Anthropic), modifiable section par section, ne touche jamais la préparation, alerte « la préparation a changé, reproposer ? », repli sur la préparation découpée par intertitres, Cloé seule ; migration montrée avant application
- [x] 5. Notes : heure de séance et section en cours au-dessus de chaque note, Entrée range, Maj+Entrée saut de ligne, enregistrées au fil de l'eau
- [x] 6. « À aborder » : une ligne en haut, premiers mots de chaque entrée, filet rose, « lire » ouvre le texte complet
- [x] Captures 390 px et 1280 px (design/captures-fluidite), build, lint, ce fichier à jour, push
- Captures ms-* dans design/captures-fluidite (page d'essai temporaire avec le texte de la maquette, rien en base, page retirée ensuite).
- Pas encore vérifié : une vraie proposition par Claude (clé Anthropic dans Vercel), l'enregistrement d'une note connectée en tant que Cloé, la page « Modifier section par section » en vrai.
- [x] Correction du 16 novembre : premier essai de Cloé (Déborah, séance 11) refusé, « un texte à lire en entier n'est pas, mot pour mot, un passage de la préparation (section Déroulé) ». Cause : le modèle regroupait des citations non consécutives en un seul bloc à lire. Désormais : paragraphes non consécutifs = blocs séparés ; un bloc repéré par le modèle qui n'est pas un passage exact reste du texte ; les blocs marqués par Cloé restent contrôlés comme avant. Rejoué sur sa vraie préparation avec une réponse simulée : acceptée, allégée de 37 %. Titres « hypno » et « méditation guidée » ajoutés aux sections gardées entières (la séance hypno de Déborah est gardée en entier). Clé Anthropic vide en local (variable sensible) : pas d'appel réel possible depuis le Mac.
- [ ] Cloé reclique sur « Proposer la version séance » après le déploiement

## Fiche : mots et stations proposés (16 novembre 2026)
- [x] Vérifié en base : Vanessa 1 à 6 ont trois mots et une station proposés (enregistrés le 12 novembre au soir), aucun validé. Problème d'affichage, pas de données.
- [x] Fiche : les lignes de séance montrent les mots proposés (violet, « proposés » et la station) quand rien n'est validé ; la dernière séance les montre en pastilles bordées avec « valider » (ouvre « dater et nommer » sur cette séance) ; le bandeau « à dater et nommer » dit que des propositions attendent ; « modifier le chemin » montre la station proposée en indication. Le chemin lui-même n'affiche toujours que les stations validées.
- [ ] Vérification de Cloé sur le site (pas de connexion possible en local : le lien de connexion mène au site en ligne)

## Après la séance : dire qu'elle a eu lieu, déposer l'audio (demande de Cloé, 19 novembre 2026)
Vécu : sortie de la séance 7 de Vanessa, aucun moyen depuis la fiche de dire qu'elle a eu lieu ni de déposer l'audio.
- [x] 1. Heure de début passée : plus « à venir » ; sur la fiche et l'agenda, action principale rouge « Déposer l'audio » vers la page séance, étape Audio
- [x] 2. Déposer un audio ou un transcript marque la séance comme ayant eu lieu, sans rien cocher
- [x] 3. Page séance, deux gestes discrets : « Elle n'a pas eu lieu » (reporter ou annuler) et « Elle a eu lieu, sans audio »
- [x] 4. Fiche : toute ligne de séance ouvre la page séance au clic sur son titre ; « Préparer » reste un lien à part
- [x] 5. Page séance : « la séance a eu lieu » sorti de « modifier la date »
- [x] Aucun email vers une cliente : vérifié. Les seuls envois automatiques vont à Émilien (transcript prêt, réglage PREVENIR_EMILIEN) et à Cloé (retours) ; aucun déclencheur en base sur les séances (seulement la date de mise à jour) ; aucune tâche planifiée. Reporter, annuler, « a eu lieu » : personne n'est prévenu.
- Détail : audio déposé, PDF de transcript, transcript collé et transcription aboutie notent la séance « faite ». Fiche : ligne « a eu lieu ? audio à déposer » avec « Déposer l'audio » (rouge), même bouton en tête de fiche, titres des séances à venir cliquables vers la page séance, « Préparer » à part, séances annulées en ligne estompée. Agenda : ces séances en tête de « Il reste à faire » (elles n'apparaissaient plus nulle part : cause du 19 novembre). Page séance : « modifier la date » ne change que la date ; bandeau « La séance a eu lieu ? Dépose l'audio » vers l'étape Audio ; « Elle a eu lieu, sans audio » ; « Elle n'a pas eu lieu » (reporter à une date, ou annuler).
- [x] Lint et build passent
- [x] Captures 390 px et 1280 px (design/captures-fluidite/apres-*) : agenda, fiche de Vanessa, page de sa séance 7. Session locale ouverte avec l'accord de Cloé le 19 novembre (lien à usage unique créé côté serveur, aucun email), déconnectée ensuite. L'agenda montre aussi Déborah 11 (16 novembre) : audio à déposer
- [x] Commit et push

## Pratiques et connexion (docs/09-pratiques-et-connexion.md, demande de Cloé du 19 novembre 2026)
Le brief 09 prime sur les précédents pour les pratiques côté cliente et la connexion. Ordre de la section 6.
- [x] 1. Vocabulaire : « pratiques » à la place de « lettre » partout où une cliente, Émilien ou Cloé le lit ; `/espace/lettre/[id]` devient `/espace/pratiques/[id]` avec redirection ; titres repris sur le modèle « Pratiques pour la séance N ». Lecture à blanc des titres avant et après, montrée à Cloé, elle arbitre, puis écriture
- [x] 1 bis. Script scripts/nettoyer-liens-notion.ts : lecture à blanc (pour chaque envoi, ce qui serait retiré), arbitrage de Cloé, puis application
  - [x] Lectures à blanc du 19 novembre, montrées à Cloé, rien écrit : 17 titres (dont 5 de Vanessa nommés par mois, 1 brouillon vide « Après la séance 4 » rattaché à la séance 7, l'envoi d'essai du compte « cloe ») ; liens Notion seulement chez Vanessa (cinq liens morts sous la signature de l'envoi du 16 novembre, présents à la fois dans le texte de l'envoi et dans la consigne de l'exercice « Ton thermomètre ») et chez Déborah (un « ### » vide en fin de « Pour La séance 10 », dans le texte et dans l'exercice « Trois vocaux » : reste du titre « Pratiques précédentes » coupé à la migration). Rattachements douteux relevés : Vanessa 16 novembre rattaché à 3, Déborah « Pratique Séance 9 » rattaché à 9, Flora (6 novembre = séance 1 ?). L'export Notion de Déborah cite aussi un envoi « Questionnaire prépa séance PRO » absent de la plateforme
  - [x] Validé par Cloé (« tout valider », 19 novembre) : 17 titres écrits et relus en base (Déborah 3, 4, 6, 8, 9, 10, 11 ; Vanessa 3, 4, juillet, août, 6, 7, 8 ; Flora 2 ; Sarah 4 ; « Pratiques d'essai »). Rattachements non modifiés (pas demandé). Nettoyage appliqué par le script (4 éléments), relu : plus rien à retirer
  - [x] Vocabulaire : une cinquantaine de libellés côté cliente, Émilien et Cloé ; titre par défaut « Pratiques pour la séance N » ; côté cliente les titres se lisent « Mes pratiques pour la séance N » ; recherche « Pratiques » ; bilan et PDF ; /espace/pratiques/[id] avec redirection de /espace/lettre/[id]. Le texte WhatsApp disait déjà « exercices » ; les emails ne contenaient pas le mot. Noms internes (tables, routes équipe, variables) inchangés
- [x] 2. Page « Mes pratiques » côté cliente (section 3) : exercices fermés, un seul ouvert, aucune zone d'écriture visible, « Prendre une note » en feuille à part, « ← Mon espace » toujours visible ; dashboard « Mes pratiques pour la séance N ». Captures 390 px et ordinateur sur les pratiques de Vanessa pour la séance 8, avant de pousser
  - [x] Composant src/components/espace/Pratiques.tsx : barre fixe « ← Mon espace » (titre au centre quand on a défilé), titre, dates, mot de Cloé replié au-delà de dix lignes, exercices fermés (numéro, titre, « tu as écrit »), un seul ouvert, le suivant replace son titre en haut, « Prendre une note » et « Exercice suivant → » (« Refermer » sur le dernier), feuille d'écriture plein écran sur téléphone et centrée sur ordinateur (« à aborder en séance » depuis la feuille), « Une question pour Cloé avant la séance », « Mes pratiques précédentes », sommaire à gauche sur ordinateur. Dashboard : « Mes pratiques pour la séance N », « Ouvrir mes pratiques »
  - [x] Captures design/captures-fluidite/pratiques-* (fermé, exercice ouvert, exercice suivant, feuille ; 390 et 1280) sur les pratiques de Vanessa pour la séance 7 : celles de la séance 8 sont un brouillon vide, non envoyé. Page d'essai locale en lecture seule, retirée ensuite ; aucune session ouverte sur le compte de Vanessa
  - Défaut ancien relevé, non corrigé : chez Vanessa, une citation qui ne contient qu'un emoji (« > 💡 », « > 🎧 ») s'affiche en encadré « Pourquoi ça compte » vide
- [x] 3. Connexion (section 5) : plan en dix lignes et guide pas à pas pour Cloé (Google Cloud, Supabase), validation, puis construction ; essais réels sur le compte de test (Google invité, Google non invité sans création de compte, mot de passe, lien magique) ; durée de session actuelle à dire et à régler
  - [x] Mesuré le 19 novembre : jeton d'accès 1 h renouvelé automatiquement, cookie de session 400 jours ; reste à vérifier les réglages de session dans Supabase
  - [x] FAILLE trouvée : inscriptions libres ouvertes dans Supabase et rôle lu dans les métadonnées déclarées par la personne (un inconnu pouvait se créer « coach »). Aucun compte inattendu (7 comptes, tous du 7 novembre). Migration 0009 écrite (rôle lu dans raw_app_meta_data), NON appliquée ; création de compte passée en app_metadata. À faire par Cloé tout de suite : couper « Allow new users to sign up »
  - [x] Plan en dix lignes et guide pas à pas : docs/10-connexion-plan-et-guide.md, montré à Cloé
  - [x] Plan validé par Cloé (19 novembre), y compris « Relier mon compte Google » par la cliente elle-même et « Google relié » en lecture seule dans la fiche
  - [x] Construit : page de connexion (Google, email et mot de passe, lien par email, « Créer ou retrouver mon mot de passe »), message neutre « Ce compte n'existe pas encore. Écris à Cloé. » (lien, Google refusé), message neutre pour un mauvais mot de passe ; /mot-de-passe (12 caractères, deux fois) ; /compte pour les trois rôles (Google relié ou « Relier mon compte Google », créer ou changer le mot de passe), lié depuis le prénom (ordinateur), le pied (téléphone) et le menu de l'équipe ; fiche : « Google relié : adresse » ; modèles d'email français à coller dans Supabase (src/content/emails-connexion.md). Captures connexion-*, mon-compte-* (390 et 1280), « Mon compte » vu sur le compte de test « cloe », déconnecté ensuite
  - [x] Réglages de Cloé (guide docs/10) et migration 0009 appliquée (selon Cloé, non vérifiable sans accès SQL) ; longueur minimale de 12 dans Supabase à confirmer (le site l'impose déjà)
    - [x] Fait par Cloé et vérifié le 19 novembre : inscriptions fermées (disable_signup true), Google activé. Essai réel : inscription libre avec un faux rôle « coach » refusée (422 « Signups not allowed »), lien magique vers une adresse inconnue refusé, toujours 7 comptes ; lien magique envoyé au compte de test « cloe » (200), réception et entrée à confirmer par Cloé
    - [x] Essai Google réussi (19 novembre, 22h20) : Cloé est entrée avec son compte Google @amarecherche.fr, rattaché tout seul à son compte coach (même adresse), aucun compte créé (toujours 7)
    - Mot de passe demandé pour cloe@kaskadnation.com : aucun email, normal, cette adresse n'a pas de compte (comptes de Cloé : @amarecherche.fr, coach, et le compte de test « cloe » en @gmail.com). Le message neutre ne dit volontairement pas si une adresse existe
    - [x] Essais restants faits par Cloé le 19 novembre (« ça marche ») : Google non invité refusé, mot de passe, lien magique ; vérifié en base : toujours 7 comptes, aucune identité Google inconnue, compte de test connecté à 22h26
    - Vérifié plus tôt le 19 novembre au soir : Google activé ; inscriptions libres TOUJOURS ouvertes (disable_signup false) ; migration 0009 non vérifiable sans accès SQL (à confirmer par Cloé) ; longueur minimale du mot de passe introuvable pour Cloé (Authentication, Sign In / Providers, fournisseur Email, « Minimum password length »). Essais réels suspendus tant que les inscriptions sont ouvertes
  - [x] Essais réels : Google invité, Google non invité (refus, aucun compte créé), mot de passe, lien magique
- [ ] Build, lint, ce fichier à jour, push ; aucun email vers une cliente sans accord ; aucun secret dans le code ni dans le chat

## « Mes pratiques » d'après les maquettes B-v2 (demande de Cloé du 19 novembre 2026)
Maquettes : B-v2-mes-pratiques-mobile (quatre états), -desktop, -note-desktop ; A-dashboard (zone « Mes pratiques ») ; F-v2-connexion ; design/assets/logo-clair-rouge.svg. Elles priment pour le dessin. Le message annonçait trois chantiers, seul le premier était collé.
- [x] Barre fixe « ← Mon espace » ; titre, date d'envoi, date de la séance ; mot de Cloé replié au-delà de dix lignes (« lire la suite »)
- [x] « Tes N exercices » (« et un bonus »), « Ouvre-les un par un, dans l'ordre que tu veux »
- [x] Exercice fermé : carte blanche, pastille violette pleine (numéro, « + » pour un bonus), titre, une ligne de description, « tu as écrit », « Ouvrir ▾ » rouge
- [x] Exercice ouvert : bandeau violet avec « Fermer ▴ », texte (composant Lire), « Pourquoi ça compte », note, « Prendre une note » et « Exercice suivant → » (absent au dernier) ; un seul ouvert ; l'en-tête referme
- [x] Feuille d'écriture : numéro et titre en rappel, date, zone de texte, « à aborder en séance », « Enregistrer », « Fermer », « Je lis tout avant notre séance. », Échap ferme, brouillon gardé
- [x] Note enregistrée : « Tu as écrit · date », « modifier », marque « à aborder en séance »
- [x] Sous la liste : mot de fin et signature, « Une question pour Cloé avant la séance », « Mes pratiques précédentes »
- [x] Ordinateur : à gauche fixe (titre, dates, mot de Cloé, signature, question, précédentes), à droite la liste des exercices, même mécanique
- [x] Captures 390 px et ordinateur, build, lint, ce fichier à jour, push
- Détails : la ligne de description est la première phrase de l'exercice (aucun exercice n'a d'accroche en base) ; un bonus a la pastille « + » et ne compte pas dans « Tes N exercices » ; le mot de fin (intertitres qui ne sont pas des exercices) va sous la liste sur téléphone, à gauche sur ordinateur ; brouillon gardé à la fermeture et au rechargement (vérifié), Échap ferme (vérifié). Logo : la maquette sur fond crème est la version violet et rouge (logo-violet.svg) ; logo-clair-rouge est crème et rouge, pour fond foncé. Les citations sans aucun mot (« > 💡 ») ne s'affichent plus en encadré vide
- Captures design/captures-fluidite/pratiques-v2-* (fermé, ouvert avec note, ouvert sans note, feuille ; 390 et 1280) sur les pratiques de Vanessa pour la séance 7 (celles de la 8 sont un brouillon vide), page d'essai locale en lecture seule retirée ensuite, note d'exemple inventée jamais enregistrée
- [ ] Les deux autres chantiers annoncés le 19 novembre : pas encore reçus

## Logo (20 novembre)
- [x] Nouveau logo crème et rouge (design/assets/logo-clair-rouge.svg) sur tous les fonds violets : connexion, mot de passe, bandeau et pied de l'espace cliente, en-tête de Cloé et d'Émilien. Sur fond clair, le logo violet reste.
- [x] Les maquettes de design/ ont aussi changé (fond sans grain, cartes et zones d'écriture blanches avec un filet) : vérifié, le site le faisait déjà depuis le chantier fluidité. Le beige reste aux petits éléments, comme dans les maquettes (« Pourquoi ça compte », lecteur audio, pastilles, extraits).

## Trois chantiers du 19 novembre (brief collé le 20 novembre)
- [x] 1. « Mes pratiques » côté cliente (barre fixe, titre et dates, mot de Cloé replié, « Tes N exercices », cartes, bandeau violet, Pourquoi ça compte, note, feuille d'écriture, question pour Cloé, pratiques précédentes, colonne fixe sur ordinateur) : déjà en place depuis le 19 ; ajouté la ligne de description écrite par Cloé. Pas de migration : la colonne pratiques.accroche existe depuis 0001. Cloé l'écrit dans l'éditeur des pratiques (« La ligne sous chaque exercice »), vide = premiers mots de l'exercice. « modifier » passé à 14 px et 44 px.
- [x] 2. Dashboard cliente : « envoyées le … · N exercices », liste numérotée (bonus en « + »), « tu as écrit », bouton rouge « Ouvrir mes pratiques », plus d'extrait. Même zone dans « Voir comme elle ».
- [x] 3. Le mot « lettre » : plus aucun texte visible côté cliente ; « lire une séance » propose « Ouvrir mes pratiques pour la séance N » ; /espace/lettre/[id] redirige. L'email J-3 n'existe pas encore (étape 5) : il dira « tes pratiques pour la séance N », comme la maquette G.
- [x] 6. Logo crème et rouge sur tous les fonds violets (fait le 20 novembre).
- [x] 4. Connexion v2 : bouton Google aux couleurs officielles (fond blanc), « Se connecter », « Recevoir un lien par email », bandeau rose sous les champs ; erreur de mot de passe ; compte inconnu avec « Écris à Cloé » (aussi par Google et par le lien) ; lien envoyé avec « Renvoyer le lien » et « Revenir à la connexion » ; « Choisis ton mot de passe » (huit caractères, « Enregistrer et entrer »). Réglages Supabase et Google déjà faits et essayés le 19.
- [x] 5. « Mon compte » dans le pied violet nuit de l'espace cliente : adresse, « Changer mon mot de passe », « Relier mon compte Google » ou « Compte Google relié », « Se déconnecter », « À propos », « Écrire à Cloé ».
- [x] Captures 390 et 1280 px dans design/captures-pratiques (compte de test « cloe », lien à usage unique créé côté serveur, aucun email).
- [x] Mot de passe : huit caractères, décidé par Cloé le 20 novembre (maquette F-v2, remplace les douze de docs/09).
- [ ] Côté Cloé : si la longueur minimale est à 12 dans Supabase, la remettre à 8 ; recoller le modèle « Reset Password » (src/content/emails-connexion.md, il dit « huit caractères »).
- [ ] Non essayé en vrai : l'état « lien envoyé » (il aurait envoyé un vrai email).
- [x] Aperçu « comme elle le voit » pour l'équipe (/coach/clientes/[id]/pratiques/[lettreId]) : la page « Mes pratiques » de la cliente, brouillon compris, rien ne s'enregistre. Bouton « Voir comme X les voit » dans l'éditeur ; « Ouvrir mes pratiques » dans « Voir comme elle » y mène. Vérifié : une cliente ou une personne non connectée n'y a pas accès. Aperçu côté Cloé non essayé avec son compte (pas de session ouverte sur son compte sans son accord).

## Application installable (PWA), brief du 22 novembre
Plan et inventaire d'abord ; Cloé a ensuite dit « va le plus loin possible, je regarde tout demain ». Tout est dans docs/11-application-installable.md (plan, inventaire, notifications, liste à vérifier sur téléphone).
- [x] 1. Installation : manifeste (nom, nom court, couleurs, plein écran, portrait, ouverture selon le rôle), icônes (iPhone, Android adaptative, écran de démarrage), invitation côté cliente seulement (Android : bouton du navigateur ; iPhone : guide en trois étapes), absente si installée, pas avant un mois si refusée, accès permanent dans « Mon compte »
- [x] 2. Confort : session de plusieurs semaines dans l'application installée (iPhone compris), cas du lien magique qui s'ouvre dans le navigateur, zones sûres, pas de zoom sur les champs, cibles de 44 px, pas de défilement horizontal, revue de toutes les pages cliente à 390 px, temps d'ouverture à froid avant et après
- [x] 3. Hors connexion : dernières pratiques ouvertes et carnet lisibles ; écrire sans réseau : message clair, rien de perdu ; ni transcripts ni audios en cache ; cache vidé à la déconnexion
- [x] 4. Notifications : rien à construire, seulement ce qui est possible sur iPhone et Android pour « tes pratiques sont prêtes » et le rappel J-3
- [x] 5. Vérifications : pas de téléphone ni de simulateur ici (Xcode absent) ; essais dans Chromium en téléphone (16 vérifications hors connexion et session, revue de 12 écrans à 390 px) ; captures dans design/pwa ; liste à vérifier par Cloé dans docs/11
- [x] Icône : A (logo entier), validée par Cloé le 23 novembre
- [ ] Côté Cloé : recoller le modèle « Magic Link » (code à six chiffres) ; vérifier Authentication, puis Sessions (pas de durée limite) ; essais sur son iPhone (docs/11, dernière section)


## Retour d'Émilien depuis un document, demande du 25 novembre
- [x] Émilien dépose un document Word ou un Google Doc pour son retour, images comprises : bloc « Tu as écrit ton retour dans Word ou Google Docs ? » sous son champ (« Déposer un document Word », ou le lien d'un Google Doc partagé par lien). Le texte revient dans le champ (titres, gras, italique, listes, liens), les images vont dans l'espace privé « retours » et s'affichent à leur place, pour Émilien (aperçu) et pour Cloé. Il relit puis envoie, comme avant. Images retirées des extraits, du temps de lecture et de la lecture automatique (phrase clé).
- [x] Vérifié : conversion d'un vrai .docx (titre, gras, image reprise à sa place), fichier qui n'est pas un Word refusé, lien qui n'est pas un Google Doc, Google Doc non partagé (message qui dit quoi faire). Build et lint.
- [x] Migration 0010 appliquée par Cloé le 26 novembre, vérifiée : l'espace « retours » accepte Word et images ; essai complet (document converti, image rangée dans Supabase, puis effacée).
- [ ] Non essayé : l'écran avec le compte d'Émilien (pas de session sur son compte sans son accord) ; un vrai Google Doc partagé par lien.
