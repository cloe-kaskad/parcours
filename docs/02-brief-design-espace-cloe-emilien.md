# Brief Claude Design : l'espace de Cloé et l'espace d'Émilien

Version 1.1, 8 novembre 2026. Complète le brief de l'espace cliente (`docs/01-brief-design-espace-cliente.md`). Décisions produit validées par Cloé. Maquettes dans `design/ecrans/` (planches H à P, composants-espace-cloe, deux emails).

## 1. En une phrase

L'outil de travail de Cloé entre les séances : un agenda qui dit ce qui reste à faire pour chaque cliente, une fiche par cliente qui est son espace vu de l'autre côté, et un moment clé rendu sans effort : le soir d'une séance, l'audio arrive, tout le reste s'enchaîne. Pour Émilien, une seule chose : ce qu'il a à lire et à écouter, avec un endroit pour écrire son retour.

## 2. Décisions produit (validées)

1. Le geste central est le dépôt de l'audio de séance. Cloé enregistre sur son téléphone et envoie en un clic dans le dossier Drive de la cliente, comme aujourd'hui. Google Drive prévient la plateforme dès qu'un fichier arrive dans un de ces dossiers (notification, pas de vérification en boucle), avec une vérification de sécurité une fois par jour. La plateforme récupère l'audio, le copie, lance la transcription (avec identification des locuteurs), le formatage, le PDF, prévient Émilien, et propose trois mots et une station pour le chemin. Un dépôt manuel depuis la page séance reste possible.
2. La page d'accueil de Cloé est l'agenda : les séances dans le temps, avec ce qui reste à faire accroché à chacune. Pas de liste d'alertes séparée : une séance passée à laquelle il manque quelque chose s'affiche en rouge.
3. Les lettres d'exercices s'écrivent hors plateforme (avec Claude). La plateforme reçoit la lettre par collage, en conservant la mise en forme (Markdown : titres, gras, citations, encadrés « pourquoi »), puis Cloé envoie. Pas d'aide à la rédaction dans la plateforme.
4. La préparation de séance se fait aussi hors plateforme. Chaque séance à venir a une page « Avant la séance » qui rassemble automatiquement le transcript précédent, le retour d'Émilien, la lettre envoyée, le carnet de la cliente (entrées « à aborder » en tête), ses météos, les ressources ouvertes, plus une zone privée « Ma préparation » où Cloé colle ce qu'elle a préparé.
5. Émilien a son propre accueil : « À lire », la liste des séances dont le transcript est prêt et qu'il n'a pas encore traitées. Pour chaque séance : l'audio (lecteur), le transcript en lecture, et son retour écrit dans la marge. Quand il enregistre, Cloé est prévenue. Il garde l'accès à tout le reste, mais son entrée c'est « À lire ».
6. Les notes personnalisées d'Émilien (PDF) se déposent dans l'espace de la cliente, dans sa mémoire, comme un objet à part (« Une note d'Émilien pour toi »).
7. La bibliothèque s'alimente en collant un lien : image, titre, auteur et description sont récupérés, Cloé valide ou corrige la description, puis partage à une cliente depuis sa fiche avec son mot. Émilien peut proposer une ressource depuis son retour.
8. La fiche cliente est une seule page qui se déroule : l'espace de la cliente, tel qu'elle le voit, avec les outils de Cloé en plus à chaque endroit. Pas d'onglets.
9. Les trois mots et la station du chemin sont proposés automatiquement après chaque transcript et validés par Cloé sur la page de la séance. La couverture de la cliente est choisie à sa création (banque d'images ou génération à partir de l'intention).
10. En dehors de la plateforme : rappel Google Agenda à J+7 pour les exercices, email J-3 à la cliente, et un email à Cloé le matin s'il y a du retard (transcript à J+1, exercices à J+7), un seul par jour.

## 3. Direction visuelle

Même palette et typographies que l'espace cliente. L'espace de Cloé est un outil : papier dominant, violet en bandeau et en profondeur, rouge uniquement pour ce qui est en retard et pour l'action principale de chaque page (une seule). Mobile aussi important que le desktop.

## 4. Les écrans (maquettes dans `design/ecrans/`)

- H, l'agenda (accueil Cloé) : « Il reste à faire » en tête, puis les séances par semaine, chaque ligne avec prénom, numéro, date, et trois points d'état (transcript, Émilien, exercices ; rouge = en retard) ; « Avant la séance » pour les séances à venir ; « Nouvelle séance ».
- I, la fiche cliente : l'écran A vu par Cloé, mêmes zones, avec un bandeau d'outils discret au-dessus de chacune (changer la couverture, modifier l'intention et le chemin, écrire la lettre, partager une ressource, nouvelle séance, déposer une note d'Émilien) ; en bas, compte, lien d'accès, dossier Drive relié.
- J, la séance : le fil du soir en quatre temps (audio, transcript, Émilien, exercices) avec états ; zone de dépôt d'audio ; lecteur ; mots et station proposés à valider sous le transcript.
- K, écrire la lettre : éditeur un seul bloc, collage Markdown conservé, encadrés « Pourquoi ça compte » reconnus, volet sources (transcript, retour d'Émilien, carnet), « Enregistrer le brouillon », « Envoyer à [prénom] », texte WhatsApp prêt à copier après envoi.
- L, avant la séance : entrées « à aborder » en tête, carnet depuis la dernière séance, météos, blocs repliés (lettre envoyée, retour d'Émilien, transcript précédent), ressources ouvertes, zone privée « Ma préparation ».
- M, la bibliothèque côté Cloé : « Coller un lien », carte remplie automatiquement, description à valider, « Partager avec… », marque « proposée par Émilien ».
- N, créer une cliente : prénom, nom, email, intention, dossier Drive, couverture (banque ou génération), « Créer son espace » ; l'envoi du lien d'accès est un geste séparé.
- O, à lire (accueil Émilien) : séances avec transcript prêt et sans retour, la plus ancienne d'abord ; « Déjà traitées » replié.
- P, lire et répondre : lecteur (1x, 1,25x, 1,5x, position mémorisée), transcript, « Mon retour » en marge (desktop) ou en bas (mobile), ressource à proposer, « Envoyer à Cloé ».
- Emails : retards pour Cloé (`email-retards-cloe`), transcript prêt pour Émilien (`email-transcript-pret-emilien`), retour d'Émilien envoyé (à faire sur le même modèle).
