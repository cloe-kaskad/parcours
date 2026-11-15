# Diagnostic de vitesse (15 novembre 2026)

Mesures faites en production (parcours.amarecherche.fr) et sur un serveur local instrumenté, sur les vraies pages de Déborah. Rien n'a encore été changé pour la vitesse.

## Ce qu'on a mesuré

| Page | Production : page reçue | Requêtes en base | Étapes qui s'attendent |
|---|---|---|---|
| Vue équipe | 5,2 s | 69 | 10 |
| Avant la séance | 5,1 s | 37 | 16 |
| Bilan | 3,1 s | 22 | 8 |
| À lire (Émilien) | 2,9 s | 17 | 7 |
| Chercher | 2,8 s | 34 | 9 |
| Lire une séance (Émilien) | 2,6 s | 20 | 11 |
| Bibliothèque | 2,2 s | 22 | 6 |
| Agenda | 2,1 s | 29 | 4 |

Fichiers chargés par le navigateur : 150 à 270 Ko de code, déjà en cache d'une page à l'autre ; images, moins de 40 Ko ; le fichier le plus lent, environ 15 ms. Un fichier fixe du site répond en 40 à 120 ms.

## Conclusions, et pourquoi

1. Ce n'est pas le poids des fichiers. Le temps « page prête » est presque égal au temps « page reçue » : le navigateur n'attend quasiment rien d'autre que la page elle-même. Le code et les images pèsent peu et sont en cache.
2. Tout le temps est passé sur le serveur, à interroger la base. Une page fait de 17 à 69 requêtes, en 4 à 16 étapes successives : chaque étape attend la réponse de la précédente.
3. Le serveur et la base sont sur deux continents. L'en-tête `x-vercel-id: cdg1::iad1` montre que les pages sont calculées à iad1 (Washington, États-Unis). La base répond en 25 à 36 ms depuis Paris, et son adresse (2a05:d018:…) est celle d'Amazon en Irlande (eu-west-1). Chaque étape paie donc un aller-retour transatlantique. En local (Paris vers Irlande), les mêmes pages se chargent en 0,6 à 1,8 s au lieu de 2 à 5 s : c'est la part due à la distance.
4. La connexion est vérifiée trop souvent. L'appel « qui est connectée ? » (auth/user) part de 6 à 26 fois par page : une fois dans le contrôle d'accès de chaque requête, et à chaque lien préchargé par la page.
5. La vue équipe crée 10 liens signés de fichiers (audio, PDF) un par un, avant d'afficher quoi que ce soit, alors qu'on n'en ouvre qu'un ou deux.
6. L'en-tête (sélecteur de clientes) recharge toutes les séances de toutes les clientes à chaque page, et seulement après le contenu : deux étapes de plus partout.

## Pistes, de la plus rentable à la moins

1. Faire calculer les pages en Irlande (région dub1 dans Vercel), à côté de la base. Un réglage, aucun changement de code. Gain attendu : de 2 à 5 s vers environ 0,6 à 1,8 s (les temps mesurés en local). À confirmer : la région exacte de la base, dans Supabase, Project Settings, General, Region.
2. Lancer les requêtes en même temps au lieu de les enchaîner (vue équipe, avant la séance, page séance d'Émilien) : de 10 à 16 étapes vers 3 ou 4. Gain attendu : encore la moitié environ.
3. Vérifier la connexion sans appel réseau : lire le jeton localement (getClaims de Supabase) dans le contrôle d'accès et dans getProfil. Supprime 6 à 26 appels par page.
4. Créer les liens signés seulement quand on clique (ou en un seul appel groupé) : 10 appels de moins sur la vue équipe.
5. Alléger le sélecteur de l'en-tête : une requête légère, lancée en même temps que la page, au lieu de recharger tout l'agenda.
6. Ensuite seulement : préchargement des liens limité aux plus utiles, recherche indexée si les textes grossissent. Le poids des fichiers ne demande rien pour l'instant.

## Fait le 15 novembre (accord de Cloé : « dans l'ordre »)

1. Région : `vercel.json` demande dub1 (Dublin), à côté de la base. S'applique au prochain déploiement.
2. Requêtes lancées ensemble : vue équipe, « Avant la séance » (lettre avec ses exercices et ressources avec leur fiche par jointure), en-tête chargé dès le début de la page.
3. Connexion vérifiée sur place (getClaims) dans le contrôle d'accès et getProfil : plus aucun appel « qui est connectée ? » en réseau (la clé de la base le permet).
4. Fichiers (audio, PDF, vocaux) signés seulement à l'ouverture, par /api/fichier, avec la session de la personne : les règles de stockage s'appliquent.
5. Agenda et sélecteur : une seule lecture par page, sans les transcripts (1,3 Mo devenus 8 Ko).

Mesuré en local (Paris vers Irlande), mêmes pages, avant puis après :

| Page | Avant | Après | Étapes successives |
|---|---|---|---|
| Vue équipe | 1,77 s | 0,92 s | 10 → 3 |
| Avant la séance | 1,32 s | 0,49 s | 16 → 3 |
| À lire (Émilien) | 1,20 s | 0,52 s | 7 → 3 |
| Lire une séance | 0,84 s | 0,38 s | 11 → 6 |
| Agenda | 0,57 s | 0,36 s | 4 → 3 |
| Bibliothèque | 0,84 s | 0,38 s | 6 → 2 |

Vérifié : pages de Cloé, d'Émilien et de la cliente de test sans erreur ; audio ouvert par /api/fichier ; une cliente ne peut ouvrir aucun fichier de l'équipe (403) ni entrer dans l'espace équipe ; sans session, renvoi vers la connexion.

Mesuré en production le 15 novembre au soir, après le déploiement (pages calculées à Dublin, en-tête `cdg1::dub1`) :

| Page | Avant | Après |
|---|---|---|
| Vue équipe | 5,2 s | 0,83 s |
| Avant la séance | 5,1 s | 0,65 s |
| Bilan | 3,1 s | 0,47 s |
| À lire (Émilien) | 2,9 s | 0,56 s |
| Chercher | 2,8 s | 0,88 s |
| Lire une séance (Émilien) | 2,6 s | 0,36 s |
| Bibliothèque | 2,2 s | 0,41 s |
| Agenda | 2,1 s | 0,44 s |
