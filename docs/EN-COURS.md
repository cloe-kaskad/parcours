# En cours : reprise de la plateforme parcours (brief du 7 novembre 2026)

## État au 10 novembre 2026

Aucun email n'est jamais parti vers une cliente. En ligne : https://parcours.amarecherche.fr (derniers codes poussés : transcription Deepgram avec email d’essai à Cloé, puis « Se déconnecter » et couverture moins haute).

### Fait et en ligne
- Migration Notion des quatre clientes, revue design (12 points), migration 0003 appliquée.
- Étape 1 : socle visuel, page d'accueil cliente, connexion.
- Étape 2 : la lettre, le carnet, lire une séance, la médiathèque ; 14 lettres reconstituées.
- Étape 3 : l'espace de Cloé (agenda, fiche, séance, éditeur de lettre, avant la séance, bibliothèque, nouvelle cliente) ; vignettes des 7 ressources avec lien récupérées.
- Étape 4, partie 1 : l'espace d'Émilien (« À lire », lire et répondre), email à Cloé quand il envoie son retour (jamais encore envoyé pour de vrai).
- Étape 4, partie 2 : transcription Deepgram depuis un dépôt d'audio (voix, Markdown, PDF ivoire et Lora, trois mots et une station, relance). Testée avec un faux retour de Deepgram seulement.
- Clé `DEEPGRAM_API_KEY` ajoutée dans Vercel et redéployée par Cloé (étapes 1 à 5 du guide).
- Pendant les essais, l'email « transcript prêt » arrive à Cloé, pas à Émilien (`PREVENIR_EMILIEN = false` dans `src/lib/transcription/index.ts`).

### En cours
- Premier essai réel de transcription : Cloé dépose un vrai audio sur son compte de test (« cloe », en retrait), puis dit si l'email est arrivé, si les voix portent les bons prénoms et si les trois mots lui parlent.
- Fiche cliente en vue équipe (`docs/04-fiche-cliente-vue-equipe.md`) : menée par une autre session (« Fiche cliente vue équipe »). Le point 1 (« Se déconnecter », hauteur de couverture) est poussé, il reste à le vérifier sur le site. Migration 0004 appliquée et vérifiée ; import du Drive fait (55 fichiers) ; vue équipe poussée, à vérifier par Cloé sur le site. Voir la section en bas de ce fichier.

### Attend une décision ou une action de Cloé
- Quand l'email « transcript prêt » doit repartir vers Émilien (un réglage à changer).
- Supprimer les entrées de carnet de Flora et Sarah, qui ne contiennent que la consigne de Notion (effacement définitif).
- Extraire le texte des 12 transcripts migrés, qui n'existent qu'en PDF, pour qu'ils se relisent comme un texte.
- Fournir la banque de dix couvertures (quatre des cinq images actuelles sont trop petites).
- Autoriser Google Drive (projet Google, autorisation), pour que l'audio déposé dans le dossier d'une cliente lance la transcription tout seul.
- Feu vert pour l'étape 5 (rappels J-3 et retards, événement Google Agenda à J+7, ouverture aux clientes, résiliation de Notion).
- Les saisies à la main listées plus bas (dates, titres, rattachements).

### Décisions déjà prises
- Le transcript est visible par la cliente dès qu'il est prêt, sans relecture préalable (Cloé, 10 novembre). Cloé corrige avec « corriger » sur la page de la séance si besoin.
- Transcription : Deepgram, plutôt que le serveur Hostinger.

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
  - [ ] Audios de plus de 50 Mo : à alléger avant dépôt, ou plafond à relever dans Supabase (offre payante) ; version allégée de « Deborah 10 » (28 Mo) prête dans Téléchargements
- [x] 4. Vue équipe (section 3) sur /coach/clientes/[id], fiche actuelle déplacée sur /coach/clientes/[id]/espace derrière « Voir comme elle » ; Émilien sans la préparation ni les outils d'écriture de Cloé ; captures 390 px avant de pousser
  - [x] Construite en local (build et lint passent) : bandeau, il reste à faire, où elle en est (note de parcours), séances dépliables avec audio, transcript, retour, préparation, notes d'Émilien, carnet, ressources, compte ; ancienne fiche déplacée sur /coach/clientes/[id]/espace (carnet complet)
  - [x] Captures 390 px faites en local, vue de Cloé et vue d'Émilien (session locale ouverte avec l'accord de Cloé) : ni préparation ni outils de Cloé côté Émilien, « Écrire mon retour » présent ; corrigés : « Nouvelle séance » illisible sur le bandeau, bouton du lien d'accès illisible sur papier, séance ouverte par défaut = dernière vécue
  - [x] Planche I v2 de Claude Design (téléphone, ordinateur, Émilien) appliquée au dessin : bandeau violet et boutons ronds, note dans un encadré beige, objets de séance encadrés, mots validés en pastilles, mots à poser sur une ligne, ressources avec vignette et suivi ; captures 390 px vue de Cloé et vue d'Émilien
  - [ ] Vérification de Cloé sur le site
