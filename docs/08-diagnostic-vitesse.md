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
