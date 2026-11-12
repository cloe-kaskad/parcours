# Lire, écrire, préparer (retours de Cloé du 12 novembre 2026)

Cloé a utilisé « Avant la séance » pour la séance 11 de Déborah. Quatre constats, quatre décisions. Ce document prime sur les briefs précédents pour ces points.

## 1. Constats

1. Lire est pénible. Le retour d'Émilien s'affiche tout en italique violet, en bloc, dans une colonne étroite. Plus largement, les textes longs côté équipe (retours, transcripts, lettres, préparations) sont rangés dans de petits espaces qui ne donnent pas envie.
2. La lettre écrite pour la séance 11 n'est pas sur la plateforme. Cause : elle a été écrite dans Notion le 7 novembre après l'export qui a servi à la migration. La page Notion « Pratique - Déborah » porte aujourd'hui la lettre « pour notre dernière séance du parcours » (Ce que tu ferais, Le carnet, Les trois regards), et « Pour la séance 10 » y est passée dans les pratiques précédentes. Ce n'est pas un bug d'affichage : la lettre manque en base.
3. Cloé ne sait pas où voir ce que la cliente a écrit sous ses exercices, ni reconnaître d'un coup d'œil que c'est la cliente qui parle. Rien ne la prévient quand une cliente écrit.
4. Le bloc « Ma préparation » (zone de texte vide) ne sert à rien. Cloé prépare ses séances avec Claude dans son projet B&I (skills coach et hypno, historique des clientes). Ce qu'il lui faut : que Claude ait accès aux données de la plateforme, pour qu'une seule demande (« aide-moi à préparer la séance 11 de Déborah ») suffise.

## 2. Décisions

### 2.1 Lecture (à corriger tout de suite, sans attendre de maquette)

- Plus aucun texte long en italique. L'italique Libre Baskerville reste réservé aux mentions courtes (dates, une citation de deux lignes au plus).
- Un seul composant de lecture pour tous les textes longs de l'espace équipe (retour d'Émilien, transcript, lettre, préparation, note de parcours) : DM Sans droit, 17 px, interligne 1.65, encre `#111111` sur papier, colonne de 62 à 68 caractères, paragraphes séparés d'un vrai blanc, rendu Markdown (gras, listes, citations, intertitres).
- Retours d'Émilien importés du Drive : texte brut, souvent sans structure. À l'affichage : retirer la première ligne quand elle répète le titre (« Retour Emilien – Déborah 10 »), transformer une ligne de tirets en séparation, mettre en gras l'amorce d'une ligne du type « Niki : », « Alexandra : ».
- Version lisible d'un retour : à l'enregistrement ou à l'import d'un retour, produire une mise en forme (paragraphes, intertitres courts, phrases clés en gras, citations de la cliente en citation) avec la règle absolue de ne changer aucun mot d'Émilien, ni l'ordre. Stockée à part (`retours.contenu_lisible`), le texte d'origine reste accessible par « texte d'origine ». Si la mise en forme échoue ou modifie des mots (contrôle : mêmes mots dans le même ordre, hors ponctuation de mise en forme), on affiche l'original.
- Lecture en grand : tout texte long a un geste « Lire » qui l'ouvre en pleine page par-dessus (fond papier, colonne centrée, fermeture par Échap ou « Fermer », position de lecture gardée). Sur téléphone, c'est une page plein écran.
- Dans « Avant la séance », l'ordre devient : ce qu'elle veut aborder ; la lettre avec ce qu'elle a écrit ; le retour d'Émilien ; le reste du carnet ; météos ; ressources ; transcript ; préparation.

### 2.2 La lettre manquante de Déborah

- Cloé colle la lettre (Markdown fourni) dans l'éditeur de lettre de Déborah, rattachée à la séance 10 (elle prépare la séance 11), puis « Envoyer à Déborah » (aucun email ne part).
- Vérifier pour Vanessa, Flora et Sarah si la page Notion a changé depuis l'export du 7 novembre.

### 2.3 Ce que la cliente écrit

Côté équipe :
- La lettre s'affiche avec les notes de la cliente à leur place, sous l'exercice concerné, et la note de fin de lettre en bas. Une lettre sans note le dit (« Elle n'a rien écrit sous cette lettre »).
- La voix de la cliente a un traitement unique partout (fiche, avant la séance, page séance, carnet) : bloc beige, filet rose à gauche, « Déborah a écrit » et la date en tête, texte droit. Jamais confondu avec la voix de Cloé (papier, encre) ni celle d'Émilien.
- Sur l'agenda et la fiche, une marque « a écrit » avec la date quand une cliente a écrit depuis la dernière visite de Cloé (`journal.vu_par_coach_at`).
- Un email à Cloé quand une cliente écrit : un seul par cliente et par période d'écriture (envoyé trente minutes après la dernière écriture, pour regrouper), avec les textes dedans et un lien vers la fiche. Jamais d'email à la cliente pour cela. Réglage pour le couper.

Côté cliente :
- Un seul geste, « Écrire », toujours au même endroit : sous chaque exercice, en fin de lettre, en tête du carnet. Ce qu'elle a écrit reste visible à l'endroit où elle l'a écrit, daté, modifiable.
- Une phrase, une fois, dans la lettre : ce qu'elle écrit, Cloé le lit avant la séance.

### 2.4 Préparer une séance avec Claude

Deux temps.

Temps 1, tout de suite : « Copier le dossier pour Claude ». Un bouton sur « Avant la séance » qui met dans le presse-papiers, en Markdown, tout le dossier de la séance : cliente, numéro et date ; intention et note de parcours ; ce qu'elle veut aborder ; la lettre envoyée avec ses notes sous chaque exercice ; le reste du carnet depuis la dernière séance ; météos ; ressources et suivi ; retour d'Émilien sur la dernière séance ; transcript de la dernière séance ; mots et stations du chemin ; la préparation de la séance précédente. Cloé colle dans son projet B&I et demande sa préparation. Le bloc « Ma préparation » cesse d'être une zone de saisie nue : il affiche la préparation (collée ou déposée) avec le composant de lecture, et « Modifier » ouvre l'édition.

Temps 2, ensuite : un connecteur. La plateforme expose un serveur MCP (`/api/mcp`) que Cloé ajoute comme connecteur personnalisé dans Claude. Outils, en lecture sauf le dernier :
- `lister_clientes` : prénoms, prochaine séance, ce qui reste à faire.
- `dossier_seance(prenom, numero?)` : le même dossier que le bouton, pour la prochaine séance par défaut.
- `lire_seance(prenom, numero)` : transcript, retour d'Émilien, mots, station.
- `lire_lettres(prenom)` et `lire_carnet(prenom, depuis?)`.
- `enregistrer_preparation(prenom, numero, markdown)` : écrit la préparation de Cloé sur la séance.

Sécurité du connecteur : données très sensibles (transcripts de séances). Accès réservé au compte de Cloé, par une authentification standard du connecteur (OAuth) et non par un simple lien secret ; jamais de `service_role` exposé ; chaque appel journalisé (`acces_mcp` : outil, cliente, date) ; révocable d'un geste. À faire vérifier dans la documentation à jour des connecteurs personnalisés avant de coder.

## 3. Ordre

1. Lecture (2.1) : composant, fin de l'italique, « Lire » en grand, ordre de « Avant la séance ». Pousser, Cloé vérifie.
2. Notes de la cliente à leur place dans la lettre côté équipe, voix de la cliente (2.3, premier jet sans maquette), bouton « Copier le dossier pour Claude » et nouveau bloc préparation (2.4, temps 1).
3. Migration 0005 : `retours.contenu_lisible`, `journal.vu_par_coach_at`, `acces_mcp`. Version lisible des retours existants (lecture à blanc sur deux retours montrée à Cloé).
4. Email « elle a écrit » (essai sur le compte de test).
5. Connecteur MCP (2.4, temps 2), après validation du plan de sécurité par Cloé.
6. Reprise au dessin quand les planches de Claude Design arrivent (lecture, voix de la cliente, écrire).
