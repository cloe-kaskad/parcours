# Application installable (PWA), 22 novembre 2026

Brief de Cloé du 22 novembre. Construit la nuit du 22, à vérifier par Cloé sur son téléphone (liste en fin de document).

## Le plan, en dix lignes

1. Manifeste : « Blocages & Intuition », nom court « B&I », violet de la charte, plein écran sans barre de navigateur, portrait, ouverture sur « / » qui envoie chaque rôle chez lui (/espace, /coach, /emilien).
2. Icônes générées depuis le logo crème et rouge sur violet : Android (192, 512, adaptative), iPhone (180), et dix écrans de démarrage iPhone.
3. Invitation à installer, sur le tableau de bord de la cliente seulement : bouton du navigateur sur Android, guide en trois étapes sur iPhone, « Pas maintenant » pour un mois, absente si l'application est installée ; accès permanent dans « Mon compte » (page /espace/installer).
4. Session : les cookies de session sont reposés par le serveur à chaque ouverture, pour 400 jours ; le jeton de renouvellement de Supabase n'a pas de date de fin.
5. Lien de l'email : il s'ouvre dans Safari, pas dans l'application. Dans l'application : mot de passe et Google en premier (déjà l'ordre de la page), et un code à six chiffres dans l'email, à taper sans quitter l'application.
6. iPhone : zones sûres (encoche, barre du bas), aucun champ sous 16 px (pas de zoom), cibles de 44 px, pas de défilement horizontal : toutes les pages cliente passées en revue à 390 px.
7. Hors connexion : un service worker garde l'accueil, le carnet et les cinq dernières pratiques ouvertes ; tout le reste mène à un écran « Pas de réseau ».
8. Écrire sans réseau : un bandeau et un message clair, le texte reste dans la feuille et le brouillon est gardé sur le téléphone.
9. Jamais en cache : séances, transcripts, audios, espaces de Cloé et d'Émilien. Tout est vidé à la déconnexion.
10. Notifications : rien de construit, analyse plus bas. Vitesse mesurée avant et après.

## Ce qui existait déjà dans le repo

- Une petite icône d'onglet (src/app/icon.svg) et la couleur de barre violette sur les pages cliente.
- Rien d'autre : pas de manifeste, pas d'icône iPhone, pas de service worker, pas d'écran de démarrage.
- La session : cookies Supabase posés côté serveur (400 jours), rafraîchis par le proxy à chaque requête.
- La connexion v2 : Google, mot de passe, lien par email (les trois façons d'entrer existaient).

## Ce qui a été fait

| Point | Où |
|---|---|
| Manifeste | src/app/manifest.ts |
| Icônes, écrans de démarrage | public/pwa, générés par design/pwa/generer-icones.cjs ; balises iPhone dans src/app/layout.tsx |
| Invitation à installer | src/components/espace/InvitationInstallation.tsx (tableau de bord), src/lib/installation.ts |
| Page d'installation, guide iPhone | src/app/(cliente)/espace/installer, src/components/espace/GuideIphone.tsx ; lien « Installer l'application » dans le pied |
| Session longue | src/proxy.ts (cookies reposés pour 400 jours à chaque ouverture de page) |
| Code à six chiffres | src/app/connexion/actions.ts (verifierCode), FormulaireConnexion.tsx ; modèle d'email dans src/content/emails-connexion.md |
| Zones sûres | src/app/globals.css (viewport-fit=cover, marges env()), barres fixes et feuille d'écriture |
| Hors connexion | public/sw.js, src/app/hors-ligne, src/components/espace/BandeauHorsLigne.tsx, src/lib/reseau.ts |
| Cache vidé à la déconnexion | src/components/Deconnexion.tsx (caches et brouillons), en-tête Clear-Site-Data dans src/app/auth/deconnexion/route.ts |

L'icône retenue en attendant l'avis de Cloé : la proposition A (le logo entier, crème et rouge sur violet). Les trois propositions sont dans design/pwa/propositions-icone.png. Changer d'icône : modifier design/pwa/generer-icones.cjs puis le relancer.

## Rester connectée

- Les cookies de session sont écrits par le serveur, valables 400 jours, et reposés à chaque ouverture d'une page. Safari raccourcit à sept jours les cookies écrits par le navigateur lui-même ; ceux écrits par le serveur ne le sont pas.
- Le jeton de renouvellement de Supabase n'expire pas tant qu'il sert (réglages par défaut). À vérifier dans Supabase : Authentication, puis Sessions : « Time-box user sessions » et « Inactivity timeout » doivent rester désactivés (ou très longs).
- iPhone : l'application installée a son propre stockage, séparé de Safari. Il faut donc se connecter une fois dans l'application, même si on l'est déjà dans Safari (la page d'installation le dit). Les applications de l'écran d'accueil ne sont pas concernées par l'effacement des données de Safari après sept jours sans visite.
- Essayé ici : les cookies repartent bien pour 400 jours (Max-Age 34 560 000 secondes). Pas essayé : plusieurs semaines sur un vrai iPhone. C'est le premier point de la liste à vérifier.

## Le lien magique et l'application installée

Sur iPhone, un lien touché dans Mail s'ouvre toujours dans Safari, jamais dans l'application installée : la cliente serait connectée dans Safari, pas dans l'application. Le traitement :

1. Dans l'application, la page de connexion propose d'abord Google, puis email et mot de passe (c'était déjà l'ordre). Une cliente qui a un mot de passe ou Google n'a jamais besoin de l'email.
2. Pour la cliente qui préfère l'email : après « Recevoir un lien par email », un champ « ou tape le code à six chiffres de l'email » permet d'entrer sans quitter l'application. L'email contient le lien et le code. Il faut recoller le modèle « Magic Link » dans Supabase (src/content/emails-connexion.md) : sans ça, l'email n'a pas de code.
3. « Créer ou retrouver mon mot de passe » ouvre Safari : la cliente choisit son mot de passe dans Safari, puis l'utilise dans l'application.

## Hors connexion

- Gardé sur le téléphone, pour relire : l'accueil, le carnet, les cinq dernières pratiques ouvertes. Une page est gardée quand la cliente l'ouvre avec du réseau.
- Pas gardé : les pages de séance (transcripts), les audios (ils viennent de Supabase Storage, jamais interceptés), les ressources, tout l'espace de Cloé et d'Émilien, les pages de connexion et de compte.
- Sans réseau, une page non gardée mène à « Pas de réseau pour l'instant », avec la liste des pages gardées.
- Écrire sans réseau : un bandeau rose en bas de l'écran (« Pas de réseau. Tu peux relire tes pratiques et ton carnet ; pour écrire, attends son retour. »). « Enregistrer » répond « Pas de réseau pour l'instant. Rien n'est perdu… », le texte reste dans la feuille, et le brouillon d'une note est gardé sur le téléphone même si l'application est fermée.
- Déconnexion : les pages gardées et les brouillons sont effacés du téléphone.

## Notifications : ce qui est possible (rien n'est construit)

| | Android | iPhone |
|---|---|---|
| Possible ? | Oui, dans Chrome et dans l'application installée | Oui, seulement dans l'application installée (iOS 16.4 et après), jamais dans un onglet Safari |
| Accord de la cliente | Une question du téléphone, après un geste de sa part (un bouton « Recevoir les notifications ») | Pareil, et le bouton doit être touché dans l'application installée |
| Où elle les voit | Barre de notifications, écran verrouillé | Écran verrouillé, centre de notifications, montre ; pastille sur l'icône possible |

Ce que ça demanderait, pour les deux cas :

- Un bouton « Recevoir les notifications » dans « Mon compte », une table des abonnements (migration, RLS : chaque cliente ne voit que les siens), deux clés « VAPID » dans Vercel, et l'envoi par le serveur (bibliothèque web-push, gratuite).
- « Tes pratiques sont prêtes » : partirait quand Cloé touche « Envoyer à X » dans l'éditeur. Comme pour les emails, rien ne part sans un geste de Cloé ; on peut ajouter une case « prévenir par notification ».
- Rappel trois jours avant la séance : une tâche planifiée chaque matin (Vercel Cron) qui cherche les séances dans trois jours. C'est la même tâche que le rappel J-3 par email prévu à l'étape 5 : les deux se construiraient ensemble.
- Environ une journée de travail. Limites : une cliente qui refuse, supprime l'application ou coupe les notifications ne reçoit rien ; l'email reste le filet.

## Vitesse

Mesure : ouverture de /espace sur un téléphone simulé (4G lente, processeur quatre fois plus lent), session ouverte, cache du navigateur vidé, médiane de trois essais. Fichiers design/pwa/mesure-avant.json et mesure-apres.json.

MESURES

## Captures (design/pwa)

- 0-ecran-demarrage-iphone.png : l'écran de démarrage.
- 1-invitation-iphone-390.png, 6-invitation-android-390.png : l'invitation sur le tableau de bord.
- 2-guide-iphone-390.png : le guide en trois étapes.
- 3-mon-compte-installer-390.png : « Installer l'application » dans « Mon compte ».
- 4-plein-ecran-accueil-390.png, 5-plein-ecran-pratiques-390.png : l'ouverture en plein écran, simulée (marges de l'encoche et de la barre du bas d'un iPhone 15).
- hors-ligne-*.png : sans réseau (pratiques, feuille d'écriture, écran « Pas de réseau »).

## Ce qui n'a pas pu être essayé ici

Pas d'iPhone ni d'Android réels, pas de simulateur iPhone (Xcode n'est pas installé sur ce Mac), pas d'émulateur Android. Les essais ont été faits dans Chromium en se faisant passer pour un téléphone. Non essayé, donc :

- l'installation elle-même (le vrai bouton de Chrome, le vrai menu Partager de Safari) ;
- l'icône et l'écran de démarrage sur un vrai écran d'accueil ;
- les vraies marges de l'encoche et de la barre du bas ;
- la session qui tient plusieurs semaines ;
- Google depuis l'application installée sur iPhone (la page Google s'ouvre par-dessus l'application, puis doit y revenir) ;
- le code à six chiffres (il faut d'abord recoller le modèle d'email).

## Ce que Cloé vérifie sur son téléphone

Avant : recoller le modèle « Magic Link » (src/content/emails-connexion.md) dans Supabase, Authentication, puis Emails ; et regarder Authentication, puis Sessions (les deux réglages désactivés).

Sur iPhone, avec le compte de test :

1. Ouvrir parcours.amarecherche.fr dans Safari, se connecter : en bas du tableau de bord, l'invitation « Ton espace, comme une application ». « Voir comment » mène au guide.
2. Suivre le guide (Partager, Sur l'écran d'accueil, Ajouter) : l'icône apparaît, avec « B&I » dessous.
3. Toucher l'icône : écran violet avec le logo, puis l'application sans barre de Safari. Se connecter (mot de passe ou Google).
4. Regarder le haut (l'heure et l'encoche ne cachent rien) et le bas (la barre ne cache aucun bouton), sur l'accueil, Mes pratiques et la feuille d'écriture.
5. Toucher un champ (email, note) : l'écran ne doit pas zoomer.
6. Essayer « Recevoir un lien par email » puis le code à six chiffres, sans quitter l'application.
7. Ouvrir des pratiques, puis passer en mode avion : relancer l'application, les pratiques et le carnet se lisent ; écrire une note : message clair, rien de perdu.
8. Ne plus toucher à l'application pendant une semaine, puis deux : elle doit s'ouvrir sans redemander de se connecter.
9. Se déconnecter, se reconnecter : l'invitation ne revient pas (application installée).

Sur Android (Chrome) : mêmes étapes ; à l'étape 2, le bouton « Installer » de l'invitation ouvre la fenêtre d'installation de Chrome.
