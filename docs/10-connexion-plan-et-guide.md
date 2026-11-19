# Connexion : plan et guide pour Cloé (19 novembre 2026)

Suite du brief 09, section 5. Rien n'est construit avant la validation de Cloé.

## Ce qui a été mesuré aujourd'hui

- **Durée d'une session** : le jeton d'accès vaut 1 heure et se renouvelle tout seul à chaque visite (jeton de renouvellement présent) ; le cookie de session dure 400 jours. Côté code, une personne reste donc connectée des mois sur un appareil, tant qu'elle ne se déconnecte pas et que son navigateur garde les cookies. Reste à vérifier dans Supabase qu'aucune limite de durée ou d'inactivité n'est réglée (étape B5 du guide).
- **Faille trouvée** : les inscriptions libres sont ouvertes dans Supabase, et la base donnait au nouveau compte le rôle qu'il déclarait lui-même. Un inconnu pouvait donc se créer un compte « coach » et tout lire. Aucun compte inattendu en base (7 comptes, tous créés par Cloé le 7 novembre). Correction : fermer les inscriptions (étape B1, tout de suite) et la migration 0009 (rôle fixé par le serveur seulement), écrite, à valider.

## Plan en dix lignes

1. Fermer la faille : inscriptions libres coupées dans Supabase (Cloé), migration 0009 (Cloé l'applique après lecture), création de compte qui pose le rôle côté serveur (fait dans le code).
2. Page de connexion, dans l'ordre : « Continuer avec Google », email et mot de passe, « Recevoir un lien par email », « Créer ou retrouver mon mot de passe ».
3. Google : bouton qui passe par Supabase, retour sur /auth/callback (déjà en place pour le lien magique), même accueil selon le rôle.
4. Adresse inconnue (Google ou email) : inscriptions fermées, donc aucun compte n'est créé ; la page affiche « Ce compte n'existe pas encore. Écris à Cloé. ». Mauvais mot de passe : message neutre aussi.
5. Adresse Google différente de l'adresse du compte : Supabase ne sait pas relier deux adresses à la place de la personne. Proposition : la cliente se connecte une fois par lien ou mot de passe, puis « Mon compte » → « Relier mon compte Google » ; dans la fiche, Cloé voit « Google relié : adresse » (lecture seule, sans champ à remplir).
6. Mot de passe : « Mon compte » → « Créer mon mot de passe » une fois connectée ; sur la page de connexion, « Créer ou retrouver mon mot de passe » envoie un lien, puis une page pour le choisir. Douze caractères au moins, vérifiés côté site et dans Supabase. Cloé ne voit ni ne fixe aucun mot de passe.
7. Emails de connexion (lien et mot de passe) : envoyés par Resend, en français, dans la voix de la plateforme, via l'envoi personnalisé de Supabase (étape B4) et deux modèles d'email.
8. Session longue : rien à changer dans le code ; vérifier les réglages de session dans Supabase.
9. Les trois rôles (cliente, Cloé, Émilien) passent par la même page et les mêmes trois façons d'entrer.
10. Essais réels sur le compte de test « cloe » : Google avec l'adresse invitée, Google avec une adresse non invitée (refus, et vérification qu'aucun compte n'est créé), mot de passe, lien magique. Aucun email vers une cliente.

## Guide pas à pas pour Cloé

Aucun secret ne passe par le chat ni par le code : l'identifiant et le secret Google se collent seulement dans Supabase.

### A. Google Cloud (environ 20 minutes, une seule fois)

1. Va sur console.cloud.google.com et connecte-toi avec le compte Google de la plateforme (celui d'À ma recherche). C'est là que Google enregistre « l'application » qui demande la connexion.
2. En haut à gauche, le sélecteur de projet → « Nouveau projet » → nom « parcours » → « Créer ». Un projet regroupe les réglages de cette connexion.
3. Menu ☰ → « API et services » → « Écran de consentement OAuth » (ou « Google Auth Platform » → « Branding »). C'est la fenêtre que verront les clientes en cliquant « Continuer avec Google ».
   - Type d'utilisateurs : « Externe ».
   - Nom de l'application : « Blocages & Intuition ». Adresse d'assistance : ton adresse.
   - Domaine autorisé : `amarecherche.fr`. Liens vers la page d'accueil et la politique de confidentialité si on te les demande (amarecherche.fr).
   - Accès demandés : seulement `email`, `profile`, `openid` (les trois de base, rien d'autre).
   - Puis « Publier l'application » (statut « En production »). Sans ça, seules des adresses ajoutées à la main pourraient se connecter.
4. « Identifiants » (ou « Clients ») → « Créer des identifiants » → « ID client OAuth » → type « Application Web ». C'est la clé qui relie Google à Supabase.
   - Nom : « parcours ».
   - Origines JavaScript autorisées : `https://parcours.amarecherche.fr`
   - URI de redirection autorisés : `https://htynxzoqwkexpzgrkyhp.supabase.co/auth/v1/callback` (copie-le tel quel : c'est l'adresse de Supabase qui reçoit la réponse de Google).
   - « Créer ». Une fenêtre affiche « ID client » et « Code secret du client ». Ne les colle nulle part ailleurs que dans Supabase (étape B2). Tu peux la fermer : ils restent consultables dans Google Cloud.

### B. Supabase (environ 10 minutes)

Tout se passe sur supabase.com → le projet de la plateforme → menu de gauche « Authentication ».

1. **Tout de suite, pour fermer la faille** : « Sign In / Providers » (ou « Settings ») → décoche « Allow new users to sign up » → « Save ». Personne ne pourra plus se créer de compte seul ; tes créations de clientes depuis la plateforme continuent de marcher.
2. « Sign In / Providers » → « Google » → active-le → colle l'ID client et le code secret de l'étape A4 → « Save ». C'est le seul endroit où ils sont écrits.
3. Même page, cherche « Allow manual linking » et active-le : c'est ce qui permet « Relier mon compte Google » depuis « Mon compte ».
4. « Emails » → « SMTP Settings » → active « Custom SMTP » : hôte `smtp.resend.com`, port `465`, utilisateur `resend`, mot de passe : une clé API Resend (crée-en une dans Resend, « API Keys », avec le droit d'envoyer, et colle-la seulement ici), expéditeur `parcours@amarecherche.fr`, nom « Blocages & Intuition ». C'est ce qui fait partir les emails de connexion par Resend. Je te donnerai les deux modèles d'email en français à coller dans « Emails » → « Templates ».
5. « Sessions » (si la page existe sur ton offre) : vérifie que « Time-box user sessions » et « Inactivity timeout » sont vides ou désactivés. C'est ce qui garde les clientes connectées des semaines.
6. « Policies » ou « Password » (selon l'écran) : longueur minimale du mot de passe à 12.
7. « URL Configuration » : « Site URL » = `https://parcours.amarecherche.fr` ; dans « Redirect URLs », ajoute `https://parcours.amarecherche.fr/auth/callback` et `http://localhost:3000/auth/callback`. Ce sont les seules adresses où Supabase accepte de renvoyer quelqu'un après connexion.
8. « SQL Editor » : la migration 0009 (supabase/migrations/0009_role_serveur.sql), après l'avoir lue, comme les précédentes.

Quand c'est fait, dis-le simplement (« Google et Supabase sont prêts ») : je construis, puis je fais les essais réels.
