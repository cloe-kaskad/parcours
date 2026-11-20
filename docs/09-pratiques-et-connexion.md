# Les pratiques côté cliente, et la connexion (retours de Cloé du 19 novembre 2026)

Ce document prime sur les briefs précédents pour ces deux sujets.

## 1. Constats

1. Lire ses pratiques est l'usage principal de la plateforme pour une cliente, et c'est aujourd'hui ce qui est le moins fluide : une longue page à dérouler, avec des zones d'écriture partout, et pas de retour évident vers son espace.
2. Le mot « lettre » ne convient pas. Cloé et ses clientes disent « pratiques ».
3. Des lettres migrées gardent en bas de page des liens venus de Notion (« Octobre », « Aout », « Juillet », « Mai », « Avril » chez Vanessa, « Pratiques précédentes » chez Déborah) qui ne mènent nulle part.
4. Le lien magique seul est pénible : il faut repasser par sa boîte mail à chaque connexion.

## 2. Vocabulaire (remplace la section 6 du brief 03 sur ce point)

- L'ensemble envoyé après une séance s'appelle « pratiques » : côté cliente « Mes pratiques pour la séance 8 », côté équipe « Pratiques pour la séance 8 ». Le numéro est celui de la séance à venir (envoyées après la 7, elles préparent la 8).
- Chaque élément reste un « exercice ».
- Le mot « lettre » disparaît de toute l'interface, des emails, du texte WhatsApp, des titres de page et des messages (« Lire la lettre » devient « Ouvrir mes pratiques », « Écrire la prochaine lettre » devient « Écrire les pratiques », « Les lettres d'avant » devient « Mes pratiques précédentes »). Les noms de tables, de routes internes et de variables peuvent rester, sauf les adresses visibles par la cliente : `/espace/lettre/[id]` devient `/espace/pratiques/[id]` avec redirection de l'ancienne.
- Titre par défaut à la création : « Pratiques pour la séance N ». Les titres existants sont repris sur ce modèle (lecture à blanc montrée à Cloé avant d'écrire, car certains titres migrés sont des mois ou des dates).

## 3. La page « Mes pratiques », côté cliente

Principe : on lit, exercice par exercice. Rien n'est éditable à l'écran tant qu'elle n'a pas choisi d'écrire.

De haut en bas, téléphone d'abord :

1. Barre fixe en haut, toujours visible : « ← Mon espace » à gauche, « Pratiques pour la séance 8 » au centre quand on a défilé. Le retour est à un geste, à tout moment.
2. Titre « Mes pratiques pour la séance 8 », la date d'envoi, la date de la séance à venir.
3. Le mot de Cloé (le texte avant le premier exercice), en lecture, court. S'il dépasse dix lignes, il se replie avec « Lire la suite ».
4. La liste des exercices, fermés : numéro, titre, et une marque discrète « tu as écrit » quand c'est le cas. C'est le cœur de la page, visible sans défiler longtemps.
5. Un exercice s'ouvre au toucher, sur place, et se referme de la même façon. Un seul ouvert à la fois : ouvrir le suivant referme le précédent et place son titre en haut de l'écran. Dans un exercice ouvert : le texte, l'encadré « Pourquoi ça compte », puis en bas deux gestes : « Prendre une note » et « Exercice suivant → » (« Refermer » sur le dernier).
6. « Prendre une note » ouvre une feuille d'écriture par-dessus (plein écran sur téléphone, fenêtre centrée sur ordinateur) : le titre de l'exercice en rappel, la zone de texte, « Enregistrer », « Fermer ». Aucun champ visible dans la page avant ce geste. Une note enregistrée s'affiche dans l'exercice en bloc de lecture « Tu as écrit », avec la date et « modifier ». Le marqueur « à aborder en séance » se pose depuis la feuille.
7. Après la liste : le mot de fin de Cloé et sa signature s'il y en a un.
8. « Une question pour Cloé avant la séance » : un seul geste, qui ouvre la même feuille d'écriture (va dans le carnet, à aborder).
9. « Mes pratiques précédentes » : la liste des envois d'avant, titre et date, qui ouvrent la même page.

Sur ordinateur : même page, colonne de lecture centrée (62 à 68 caractères), la liste des exercices peut rester visible à gauche comme sommaire.

Ce qui disparaît : les zones d'écriture ouvertes sous chaque exercice, le long déroulé, le sommaire séparé (la liste fermée le remplace).

Sur le dashboard : la zone correspondante s'appelle « Mes pratiques pour la séance 8 », montre la liste des exercices, et « Ouvrir mes pratiques ».

## 4. Nettoyage des liens Notion

Script `scripts/nettoyer-liens-notion.ts` : pour toutes les pratiques de toutes les clientes, repérer en fin de contenu les blocs venus de Notion (titre « Pratiques précédentes », liens vers notion.so ou app.notion.com, liens relatifs vers des pages exportées, lignes qui ne sont qu'un lien mort comme « Octobre », « Aout », « Juillet », « Mai », « Avril »). Lecture à blanc d'abord : pour chaque envoi, ce qui serait retiré, montré à Cloé. Puis application. Rien d'autre n'est modifié dans le texte. Les envois précédents restent accessibles par « Mes pratiques précédentes ».

## 5. Connexion

Trois façons d'entrer, au choix de la personne, pour le même compte :

1. « Continuer avec Google ».
2. Email et mot de passe.
3. « Recevoir un lien par email » (le lien magique actuel, gardé).

Règles :
- Aucune inscription libre. Seuls les comptes créés par Cloé existent. Une adresse inconnue, par Google comme par email, reçoit le même message neutre et n'entre pas (« Ce compte n'existe pas encore. Écris à Cloé. »), et aucun compte n'est créé au passage. À vérifier par un essai réel avec une adresse Google non invitée.
- Google se rattache au compte existant quand l'adresse Google est la même que l'adresse du compte. Certaines clientes ont une adresse professionnelle sur leur compte et une adresse Gmail personnelle : prévoir, dans la fiche côté Cloé, « Adresse Google » en plus de l'adresse du compte, et côté cliente, dans « Mon compte », « Relier mon compte Google » une fois connectée.
- Mot de passe : la cliente le crée elle-même, depuis « Mon compte » une fois connectée, ou depuis « Créer ou retrouver mon mot de passe » sur la page de connexion (un email avec un lien, puis choix du mot de passe). Huit caractères au moins (décidé le 20 novembre, maquette F-v2). Cloé ne voit ni ne fixe aucun mot de passe.
- Rester connectée : la session dure longtemps sur un appareil (plusieurs semaines sans rien redemander), c'est la moitié du confort attendu. Vérifier la durée réelle aujourd'hui et la régler.
- Les trois rôles sont concernés (cliente, Cloé, Émilien).
- Les emails de connexion et de mot de passe passent par Resend, dans la voix de la plateforme, en français.
- Secrets Google (identifiant et secret du client OAuth) saisis par Cloé dans le tableau de bord Supabase, jamais dans le code ni dans le chat. Guide pas à pas pour elle, elle débute sur Google Cloud et Supabase.

Page de connexion : planche F à reprendre (voir brief Claude Design), dans cet ordre : Google, email et mot de passe, puis le lien par email en second choix, puis « Créer ou retrouver mon mot de passe ».

## 6. Ordre

1. Vocabulaire (section 2) et nettoyage des liens Notion (section 4, lecture à blanc d'abord). Sans attendre de maquette.
2. Page « Mes pratiques » (section 3), premier jet à partir de ce document et des composants existants ; reprise au dessin quand la planche arrive.
3. Connexion (section 5) : plan en dix lignes et guide pour Cloé d'abord, puis construction, puis essais réels sur le compte de test (Google invité, Google non invité, mot de passe, lien magique).
4. Captures 390 px et ordinateur, build, lint, `docs/EN-COURS.md` à jour, push. Toujours aucun email vers une cliente sans accord de Cloé.
