# Plateforme « parcours » de Blocages & Intuition : ce qu'on a construit, ce qu'on en a appris (état au 10 novembre 2026)

Résumé écrit pour servir de base à la future plateforme Présente !.

## 1. Le point de départ

Objectif : quitter Notion, où chaque cliente B&I avait sa page (intention, séances, exercices, ressources, notes libres), et construire un espace sur mesure sur **parcours.amarecherche.fr**, pour trois publics :
- **la cliente** : son espace personnel ;
- **Cloé** : l'outil de travail entre les séances ;
- **Émilien** : lire et écouter chaque séance, écrire son retour.

Dès le départ, le schéma de données prévoit une notion de **programme** (B&I individuel aujourd'hui, Présente ! en groupe demain). La base est donc pensée pour être reprise.

## 2. La méthode, et ce qu'elle nous a appris (le plus utile pour Présente !)

**Première tentative, ratée** : coder directement depuis le chat. Résultat jugé « pauvre », puis « pas beau, pas fluide, pas interactif » : exercices dans des boîtes éditables illisibles, un « Mon chemin » en page séparée, une météo invisible, une bibliothèque sans liens ni suivi. Notion était mieux.

**Méthode qui a marché, en trois temps** :
1. **Questions produit de fond d'abord** (une vingtaine de décisions tranchées, voir section 3), sans parler de technique.
2. **Brief pour Claude Design**, qui produit les maquettes de tous les écrans (30 planches : écrans, composants, emails, principes visuels), avec le vrai contenu d'une cliente.
3. **Seulement ensuite, Claude Code** sur le Mac, avec un brief de construction par étapes, chaque étape validée sur le vrai site avant la suivante.

Autres leçons :
- Construire sur les **vraies données** (migration Notion faite tôt), sinon impossible de juger.
- Tout ce qui compte vit **dans le repo** (`docs/` pour les briefs, `design/` pour les maquettes, `docs/EN-COURS.md` pour l'état du chantier, `CLAUDE.md` pour les règles) : on peut fermer une session Claude Code et en rouvrir une sans rien perdre.
- Penser tôt à la **vue de l'équipe**, pas seulement à celle de la cliente (voir section 4).

## 3. Les décisions produit côté participante (largement transposables)

1. **Usage réel** : trois visites maximum entre deux rendez-vous (recevoir et lire les exercices, écrire ce qui arrive, se remettre dedans la veille). Aucune mécanique d'engagement quotidien : pas de badges, pas de streaks, pas de barre de progression.
2. **Une seule page qui se déroule** (le tableau de bord), plus trois sous-pages seulement : la lettre d'exercices, le carnet, la mémoire.
3. **Le chemin** : une couverture choisie pour chaque personne (photo, illustration ou image générée depuis l'intention), et sous la photo, un tracé discret avec une station par étape passée et des mots clés. Les stations à venir restent sans nom (le parcours mène vers l'inconnu). Mots proposés automatiquement depuis le transcript, validés par Cloé.
4. **Les exercices sont une lettre** : un texte à lire, en vraie typographie, dans la voix de Cloé, chaque exercice en chapitre, encadré « Pourquoi ça compte ». Zéro champ de formulaire visible. Écrire est un geste optionnel (« Écrire » sous chaque exercice, et en fin de lettre).
5. **Un carnet unique et daté** : tout ce qu'elle écrit s'y range, avec un marqueur « à aborder en séance ».
6. **La météo** : premier geste à l'arrivée, un mot parmi sept (Claire, Posée, Vive, Fatiguée, Tendue, Brumeuse, Bousculée), une musique proposée selon l'état, une trace discrète des derniers états.
7. **Les ressources** : une médiathèque façon Liberté, Chérie ! (cartes avec image, type, titre, auteur, filtres en pastilles), avec le mot de Cloé « pourquoi pour toi » et un suivi en un geste (à découvrir, commencé, terminé). Image, titre et description récupérés automatiquement en collant un lien.
8. **La mémoire** : chaque séance en carte datée avec trois mots ; le transcript se lit comme un texte, pas comme un PDF.
9. **Communication minimale** : Cloé prévient par WhatsApp quand les exercices sont prêts ; un seul email automatique, trois jours avant le rendez-vous.
10. **Ton** : l'interface s'efface, le contenu parle. Verbes simples (Écrire, Lire la séance, J'ai écouté), jamais de jargon (publié, statut, affectation, dashboard).

## 4. Les décisions côté équipe

- **Accueil de Cloé = un agenda** : les séances dans le temps, avec ce qui reste à faire accroché à chacune (transcript, retour d'Émilien, exercices), en rouge si en retard. Pas de liste d'alertes séparée.
- **Le geste central** : déposer l'audio de séance. La transcription (Deepgram, avec identification des voix) produit le texte, un PDF, propose trois mots et une station pour le chemin, et prévient Émilien. Plus tard : détection automatique d'un audio déposé dans le dossier Google Drive de la cliente.
- **Les lettres et les préparations s'écrivent avec Claude, hors plateforme**, puis se collent avec leur mise en forme (Markdown). Pas d'aide à la rédaction dans l'outil.
- **« Avant la séance »** : une page qui rassemble automatiquement transcript précédent, retour d'Émilien, lettre envoyée, carnet (entrées « à aborder » en tête), météos, ressources ouvertes, plus une zone privée « Ma préparation ».
- **Émilien** a son propre accueil « À lire » : lecteur audio (vitesses, position mémorisée), transcript, son retour écrit en marge, « Envoyer à Cloé ». Ses notes personnalisées (PDF) se déposent dans la mémoire de la cliente.
- **Fiche cliente en vue équipe** (décidé le 10 novembre, après usage) : une page de travail avec une note de parcours partagée Cloé et Émilien, puis une ligne par séance où l'on voit côte à côte audio, transcript, retour d'Émilien et préparation. L'espace de la cliente s'ouvre à part, par « Voir comme elle ».
- **Hors plateforme** : rappel Google Agenda à J+7 pour envoyer les exercices, email du matin à Cloé seulement s'il y a du retard.

## 5. La direction visuelle

- Palette : violet profond #59114D (l'air de la maison), violet nuit #3D0A34, papier #FAF6EF avec grain, crème #F5EDE3, beige #E8DDD0 (encadrés), rose #F7BECA (touches), rouge #E6361D (rare : action principale, mots du chemin, retard).
- Typographies : League Spartan (titres très grands et serrés), DM Sans (texte, 17 à 18 px sur mobile, interligne 1,6), Libre Baskerville italique avec parcimonie (dates, citations de la cliente, mots de Cloé).
- Référence : la médiathèque de libertecherie.paris, adaptée aux couleurs B&I.
- Mobile d'abord. Une seule entrée animée à l'ouverture (couverture, puis chemin, puis le reste), ensuite le mouvement ne répond qu'aux gestes. Aucune icône décorative.
- Règle apprise : la couverture ne doit jamais prendre tout l'écran ; le chemin et le début du contenu doivent être visibles sans défiler.

## 6. La technique (réutilisable telle quelle)

- **Stack** : Next.js (App Router, TypeScript) sur Vercel, Supabase (base Postgres, authentification, stockage de fichiers), Resend pour les emails (expéditeur sur amarecherche.fr), Deepgram pour la transcription. Repo GitHub `cloe-kaskad/parcours`.
- **Connexion** : lien magique par email, sans mot de passe. Trois rôles : participante (ne voit que son espace), coach (voit tout), relecteur (Émilien : voit tout, écrit des retours invisibles pour la cliente).
- **Sécurité** : chaque table protégée ligne par ligne (une cliente ne lit que ses propres données) ; retours d'Émilien, transcripts bruts et préparations jamais visibles côté cliente ; fichiers dans des espaces privés avec liens temporaires ; secrets uniquement dans Vercel (récupérés en local avec `vercel env pull`), jamais dans le code ni le chat.
- **Données** : programmes, parcours, séances, lettres d'exercices (texte Markdown complet, exercices dérivés des titres), carnet, météo et musiques, ressources avec suivi, retours, notes d'Émilien, préparations, transcriptions, emails envoyés.
- **Migration Notion** : script qui lit l'export Notion et recrée les quatre clientes actives (séances, exercices, ressources, notes, transcripts PDF). Script similaire pour importer depuis le Drive les retours d'Émilien et les préparations.

## 7. Où on en est

- Fait : espace cliente complet (tableau de bord, lettre, carnet, séance, médiathèque, connexion), espace de Cloé (agenda, fiche, page séance avec dépôt d'audio, écriture de lettre, « Avant la séance », bibliothèque, création de cliente), espace d'Émilien, chaîne de transcription, déconnexion, vue équipe de la fiche cliente.
- En cours : premier vrai essai de transcription, import des archives du Drive, vérifications sur le site.
- Reste : saisies à la main (dates des séances migrées), banque de couvertures, autorisation Google Drive, rappels automatiques et Google Agenda, ouverture aux clientes, puis résiliation de Notion.

## 8. Ce qui se transpose à Présente !, et ce qui change

**Se reprend presque tel quel** : la stack et la sécurité, la connexion par lien magique, la notion de programme déjà dans le schéma, la lettre d'exercices à lire, le carnet avec « à aborder », la météo et sa musique, la médiathèque avec suivi en un geste et récupération automatique des liens, la couverture et le chemin, le principe « trois visites, pas de gamification », la charte de ton, et surtout la méthode questions produit, puis Claude Design, puis Claude Code.

**À repenser pour un format de groupe, sans coaching individuel** :
- L'unité n'est plus la séance individuelle mais la **masterclass** et le **cercle de parole** : un calendrier commun, des replays ou synthèses de masterclass, et pour les cercles une question de confidentialité forte (probablement ni enregistrement ni transcript).
- La **personnalisation** ne vient plus d'un transcript de séance : à définir à partir de quoi (questionnaire d'entrée, intention de départ, météo, carnet, choix de ressources) et par qui (Cloé, Émilien, un tri automatique proposé puis validé).
- Une **cohorte** : faut-il un espace commun (ressources partagées, dates, peut-être des traces collectives), en plus de l'espace personnel de chacune ?
- Le **chemin** devient un parcours de formation : étapes connues à l'avance (modules) ou toujours vers l'inconnu ?
- La **bibliothèque** devient centrale (beaucoup de ressources et d'exercices), avec une porosité possible vers Liberté, Chérie !.
- Les **rôles** : animatrices de cercles, intervenantes de masterclass, et la place d'Émilien.
- Le **modèle économique et l'accès** : inscription, paiement, durée d'accès après la fin du parcours.

Prochaine étape recommandée pour Présente ! : refaire le premier temps, une série de questions produit de fond, avant tout dessin ou code.
