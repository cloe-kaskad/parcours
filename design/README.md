# Maquettes Claude Design : Blocages & Intuition, espace cliente + espace de Cloe et d'Emilien (v1, 8 nov. 2026)

Sources des planches du canvas Claude Design, exportées pour Claude Code.

## Format
Chaque fichier `.dc.html` est une planche : tout le HTML/CSS utile est dans `<x-dc>` (styles de base dans `<helmet><style>`, le reste en styles inline). Les blocs `<sc-for>`, `<sc-if>`, `{{holes}}` et le `<script type="text/x-dc">` sont la petite logique d'etat du prototype (meteo choisie, geste Ecrire ouvert/ferme) : a traduire en composants, pas a copier. Les polices viennent de Google Fonts (League Spartan, DM Sans, Libre Baskerville italique).

## Planches
- A-dashboard-mobile / A-dashboard-desktop : le dashboard (couverture, chemin, prochaine seance, meteo + lecteur, lettre en cours, carnet, pour toi, memoire, pied)
- B-lettre-mobile / B-lettre-desktop : la lettre d'exercices en lecture pleine page, gestes Ecrire, notes
- C-carnet-mobile : le carnet (entrees "a aborder" en tete, nouvelle entree sur place)
- D-seance-mobile : lire une seance (transcript en texte courant)
- E-mediatheque-mobile / E-mediatheque-desktop : la mediatheque (filtres, cartes, suivi en un geste)
- F-connexion-mobile : connexion par lien magique (avant / apres envoi)
- G-email-j-3 : l'email automatique trois jours avant la seance
- composants : pastilles meteo, lecteur, carte ressource (3 etats), carte seance, entree de carnet, geste Ecrire (3 etats), encadre Pourquoi ca compte, prochaine seance, trace du chemin
- couverture-trace-sous-photo (reference) / couverture-trace-sur-photo : les deux variantes a trancher
- principes : la page de principes (ce que l'espace est / n'est pas) + palette et typo

## Planches de l'espace de Cloe et d'Emilien
- H-agenda-mobile / H-agenda-desktop : l'accueil de Cloe, "Il reste a faire" en tete, lignes de seance avec trois points d'etat (transcript, Emilien, exercices ; rouge = en retard)
- I-fiche-cliente-mobile : l'ecran A vu par Cloe, memes zones, avec un bandeau d'outils discret au-dessus de chacune (pas d'onglets)
- J-seance-mobile / J-seance-desktop : le fil du soir en quatre temps (audio, transcript, Emilien, exercices), mots et station proposes a valider, zone de depot d'audio pour une seance sans audio
- K-ecrire-lettre-mobile / K-ecrire-lettre-desktop : editeur un seul bloc, collage Markdown conserve, volet sources (transcript, Emilien, carnet), envoi + texte WhatsApp pret a copier
- L-avant-seance-mobile : page de preparation lisible dans le train, entrees "a aborder" en tete, blocs replies, zone privee "Ma preparation"
- M-bibliotheque-mobile : la mediatheque cote Cloe, champ "Coller un lien", "Partager avec...", marque "proposee par Emilien"
- N-creer-cliente-mobile : prenom, nom, email, intention, dossier Drive, choix de couverture (banque ou generation)
- O-a-lire-emilien-mobile : l'accueil d'Emilien, "A lire" puis "Deja traitees" replie
- P-lire-repondre-emilien-mobile / P-lire-repondre-desktop : lecteur (vitesse 1x / 1,25x / 1,5x, position memorisee), transcript, "Mon retour" en marge, ressource a proposer
- composants-espace-cloe : ligne de seance (3 points), fil des quatre temps (fait / en cours / a venir / en retard), zone de depot, lecteur, mots proposes (propose / modifie / valide), "Pourquoi ca compte" apres collage, volet de sources
- email-retards-cloe / email-transcript-pret-emilien : les deux emails

Principe de l'espace de Cloe : creme dominant, violet en bandeau, une seule action principale par page, en rouge. Rouge = en retard ou action principale, jamais decoratif.

## Palette
Violet #59114D (fond, air) · violet nuit #3D0A34 (profondeur) · papier #FAF6EF avec grain (assets/grain.png en motif repete) · beige #E8DDD0 (encadres) · rouge #E6361D (rare : action, mots du chemin, retard) · rose #F7BECA (touches sur violet) · encre #111111. Texte sur violet : creme #F5EDE3.

## Assets
assets/ : couverture generee (placeholder), vignettes generees (placeholders, en prod recuperees depuis le lien), grain, logo violet+rouge et logo blanc (SVG fournis par Cloe).

## Contenu encore invente, a remplacer
Transcript de la seance 9, regles des exercices 2 et 3, mots des seances 5 a 7 et leurs dates, deux entrees de carnet anciennes, mots de Cloe sur quatre ressources, musiques par meteo, date d'envoi de la lettre.
