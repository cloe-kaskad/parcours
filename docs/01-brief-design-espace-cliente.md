# Brief Claude Design : l'espace cliente de Blocages & Intuition

Version 1, 8 novembre 2026. Décisions produit validées par Cloé (voir section 2). Ce brief a servi à produire les maquettes du dossier `design/` ; il reste la référence produit.

## 1. Ce qu'on dessine, en une phrase

Un lieu où une femme accompagnée revient trois fois entre deux séances : pour recevoir et lire les exercices que Cloé lui a écrits, pour écrire ce qui lui arrive, et pour se remettre dedans la veille de la séance. Pas une app qu'on consulte tous les jours : un espace personnel, chaleureux, qui lui ressemble, et qui lui dit en un regard où elle en est.

Référence directe de ce qui marchait : l'espace Notion de chaque cliente (une page qui se lit de haut en bas comme une lettre, un visuel du parcours en tête, la liberté d'écrire n'importe où). Référence visuelle : la médiathèque de libertecherie.paris (typographie éditoriale très grande, cartes avec images, filtres en pastilles, chaleur), adaptée aux couleurs B&I.

## 2. Décisions produit (validées)

1. Usage : trois visites maximum par cycle de deux à trois semaines. Aucune mécanique d'engagement quotidien, pas de badges, pas de barre de progression.
2. Structure : une seule page qui se déroule (le dashboard), et trois sous-pages seulement : la lettre d'exercices en lecture pleine page, le carnet complet, la mémoire complète.
3. Le chemin : une couverture choisie par Cloé pour chaque cliente (photo, illustration ou image générée à partir de l'intention du parcours), et un tracé discret du chemin avec une station par séance passée et des mots clés posés par Cloé (proposés automatiquement depuis le transcript). Le tracé se place sous la photo. Les stations à venir restent sans nom.
4. Exercices : la lettre est un texte à lire, avec une vraie typographie, zéro champ de formulaire visible. Écrire est un geste, optionnel, jamais obligatoire : une note possible sous chaque exercice, et une note libre en fin de lettre.
5. Un carnet unique : tout ce qu'elle écrit (notes sous les exercices, entrées libres) se range dans un carnet daté, avec un marqueur « à aborder en séance » sur n'importe quelle entrée.
6. Météo : sur la couverture, premier geste à l'arrivée, un mot parmi sept (Claire, Posée, Vive, Fatiguée, Tendue, Brumeuse, Bousculée), une musique proposée pour l'état choisi, et une trace discrète des derniers états.
7. Ressources : médiathèque façon Liberté, Chérie ! (cartes avec image, type, titre, auteur, filtres), avec le mot de Cloé « pourquoi pour toi » et le suivi en un geste (à découvrir, commencé, terminé). Le clic ouvre le lien. L'image et le titre sont récupérés automatiquement depuis le lien.
8. Mémoire des séances : chaque séance est une carte datée avec trois mots posés par Cloé ; « lire la séance » ouvre le transcript dans une page de lecture, pas un PDF.
9. Communication : Cloé prévient par WhatsApp quand les exercices sont prêts (hors plateforme). Un seul email automatique, trois jours avant la séance : l'heure, et le rappel que l'espace est là.
10. Ton : tout le contenu est dans la voix de Cloé, en « tu ». L'interface s'efface : verbes simples (Écrire, Lire la séance, J'ai écouté), jamais de jargon (publié, statut, affectation).

## 3. Direction visuelle

Palette : violet profond `#59114D` (fond, air), violet nuit `#3D0A34` (profondeur), papier `#FAF6EF` avec grain (`design/assets/grain.png`) et crème `#F5EDE3` (texte sur violet), beige `#E8DDD0` (encadrés), rouge `#E6361D` (rare : action, mots du chemin, retard), rose `#F7BECA` (touches sur violet), encre `#111111`.

Règle : le violet est l'air de la maison, le crème est le papier, le rouge est rare. Pas de dégradés décoratifs, pas d'ombres grises génériques, pas de cartes toutes identiques.

Typographie : League Spartan (titres très grands et serrés, grands mots, chiffres), DM Sans (texte courant, 17 à 18 px sur mobile pour les lettres, interligne 1.6), Libre Baskerville italique avec parcimonie (citations de la cliente, date du jour). Logo : « blocages » en League Spartan, « & INTUITION » en rouge (SVG dans `design/assets/`).

Images : une couverture par cliente, grand format. Vignettes de ressources récupérées automatiquement. Aucune icône décorative.

Mouvement : une seule entrée orchestrée à l'ouverture du dashboard (couverture, puis tracé du chemin, puis le reste). Ensuite, le mouvement ne répond qu'aux gestes.

## 4. Les écrans (maquettes dans `design/ecrans/`)

- A, le dashboard : couverture (image, logo, prénom), chemin sous la photo (tracé, stations, mots), point du cycle et prochaine séance, météo (sept mots, musique, mot facultatif, trace), lettre en cours (titre, date, premières lignes, liste des exercices avec marque « tu as écrit », « Lire la lettre »), carnet (deux ou trois entrées, « Écrire » sur place), pour toi (cartes de ressources, suivi en un geste, défilement horizontal sur mobile), mémoire (cartes de séances avec trois mots), pied (à propos, contact). Pas de barre d'onglets : le dashboard est la page.
- B, la lettre : lecture pleine page sur papier, colonne de 65 à 70 caractères, chaque exercice en chapitre, encadré « Pourquoi ça compte » (beige, filet rouge), geste « Écrire » sous chaque exercice et en fin de lettre, accès aux lettres précédentes en bas.
- C, le carnet : entrées « à aborder en séance » en tête, nouvelle entrée sur place, lien vers l'exercice d'origine.
- D, lire une séance : date, trois mots, transcript en texte courant avec prises de parole distinguées, lien vers la lettre envoyée après.
- E, la médiathèque : grand titre, filtres par type en pastilles, grille de cartes avec vignette, mot de Cloé, suivi en un geste, clic vers le lien.
- F, connexion : violet, logo, « Ton espace t'attend. », email, « Recevoir mon lien », confirmation.
- G, email J-3 : texte sur papier, voix de Cloé, date et heure, bouton « Ouvrir mon espace ».

## 5. Contenu réel (Déborah) utilisé dans les maquettes

Intention : « Ce parcours a été pensé pour t'aider à passer d'un système de dissociation (se couper de ton corps et de tes émotions pour performer, te scinder en plusieurs identités : la productrice, la maman, la fondatrice) à une spontanéité ancrée. » Lettre en cours « Pour la séance 10 » : Les deux colonnes, Le quart d'heure d'avant, Trois vocaux. Ressources : Pépin, « Faut-il pardonner à nos mères ? », Alice Diop, « Faire de sa vie une histoire », Ricœur. Le reste du contenu des maquettes (mots du chemin, dates, entrées anciennes, musiques) est inventé et listé dans `design/README.md`.
