# Temps 2 : plan proposé (chantier fluidité, 15 novembre 2026)

Source : design/ecrans/temps-2-dix-evolutions. Rien n'est codé. Ce document propose un ordre, un effort et les migrations ; Cloé tranche.

Effort : petit = une demi-journée à une journée ; moyen = un à deux jours ; gros = deux jours ou plus. Chaque migration est montrée à Cloé avant d'être appliquée, comme d'habitude.

## Ordre proposé

| # | Évolution | Effort | Migration | Dépend de |
|---|---|---|---|---|
| 1 | Résumé de séance | petit | 0007 : `seances.resume_propose`, `seances.resume` | clé Anthropic dans Vercel |
| 2 | Chercher | moyen | 0008 : index de recherche en français, fonction `chercher` | rien |
| 3 | Commande rapide (⌘K) | petit | aucune | 2 |
| 4 | Mode en séance | moyen | 0009 : notes prises pendant la séance | rien (le bouton est déjà là) |
| 5 | Épingler une phrase | moyen | 0010 : table des phrases épinglées | rien |
| 6 | Cloé et Émilien, par séance | moyen | 0011 : table des échanges, équipe seule | rien |
| 7 | Mots récurrents | moyen | aucune | texte des 12 transcripts migrés (aujourd'hui en PDF seulement) |
| 8 | Le fil | moyen | aucune | une décision : remplace-t-il des sections de la vue équipe ? |
| 9 | Vocaux de la cliente | gros | 0012 : vocal dans le carnet, espace de stockage privé | ouverture aux clientes (étape 5) |
| 10 | Bilan de cycle | gros | aucune | contenu à valider par Cloé, envoi seulement avec son accord |
| 11 | Remarque d'Émilien sous un exercice (planche trois-voix) | moyen | table des remarques, équipe seule | peut se fondre dans le point 6 |

## Détail

### 1. Résumé de séance (en premier)
Cinq lignes proposées après le transcript, validées par Cloé, en tête de chaque séance repliée.
- Même mécanique que les trois mots : proposé (`resume_propose`), puis validé (`resume`). Une seule lecture du transcript propose à la fois les mots, la station et le résumé.
- Affichage : vue équipe (dernière séance), écran « dater et nommer » (« Pour te souvenir »), « Avant la séance » (carte du transcript).
- Pour les 20 séances passées qui ont un transcript : propositions faites en une fois, comme pour les mots.
- Jamais montré à la cliente : à décider explicitement si un jour elle doit le voir.

### 2. Chercher (en deuxième)
Dans tout ce qui concerne une cliente : transcripts, carnet, retours d'Émilien, lettres.
- Recherche plein texte de Postgres, en français, sans tenir compte des accents ; un index par table.
- Une fonction `chercher(cliente, mots)` qui s'exécute avec les droits de la personne connectée : la Row Level Security s'applique, une cliente ne pourrait jamais remonter un retour d'Émilien.
- Résultats groupés par source, avec l'extrait et le mot surligné ; un clic ouvre le texte dans la liseuse, à la bonne place.
- Bouton « Chercher » dans l'en-tête sur téléphone (déjà prévu par la maquette H v2).
- Limite connue : les 12 transcripts migrés n'existent qu'en PDF ; ils ne seront trouvés qu'une fois leur texte extrait.

### 3. Commande rapide
Sur ordinateur, ⌘K : taper « deb » ou « prépa » propose la fiche, « préparer la séance 10 », « écrire la lettre ». S'appuie sur le sélecteur de cliente et sur la recherche.

### 4. Mode en séance
Un écran épuré pendant la visio : la préparation, ses entrées à aborder, un champ de notes rapides horodatées (« 00:24:10 »). À la fin, les notes sont rangées dans la séance, visibles par Cloé seule (même protection que « Ma préparation »).

### 5. Épingler une phrase
Une phrase repérée dans un transcript ou le carnet arrive dans « Avant la séance » et dans l'éditeur de lettre. Table réservée à l'équipe.

### 6. Cloé et Émilien, par séance
Un fil court sous le retour d'Émilien. Table réservée à l'équipe, jamais lisible par la cliente (même règle que `retours`). Pas d'email, une marque dans l'agenda.

### 7. Mots récurrents
Les mots qui reviennent d'une séance à l'autre (dommage, tenir, prouver…), calculés depuis les transcripts. Utile seulement quand les 12 transcripts migrés seront lisibles comme du texte.

### 8. Le fil
Une seule frise de tout ce qui s'est passé. Aucune donnée nouvelle. À trancher : en plus des sections de la vue équipe, ou à leur place.

### 9. Vocaux de la cliente
Elle enregistre une minute depuis son espace, c'est transcrit et rangé dans son carnet. Côté cliente, donc après l'ouverture aux clientes (étape 5) ; nouvel espace de stockage privé, chaque cliente ne lit que ses vocaux.

### 10. Bilan de cycle
Une page de fin de parcours pour elle (chemin, mots, lettres, ce qu'elle a écrit), en PDF. À faire en dernier : le contenu demande la validation de Cloé, et rien ne part vers une cliente sans son accord.

### 11. Remarque d'Émilien sous un exercice
Planche trois-voix : sous la note de la cliente, une remarque d'Émilien en marge (« Émilien · pour l'équipe »), visible dans la vue équipe et « Avant la séance », jamais côté cliente. Même protection que `retours`. Peut se faire avec le fil Cloé et Émilien (point 6), dans la même table.
