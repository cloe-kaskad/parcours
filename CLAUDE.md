# parcours, plateforme Blocages & Intuition

## Règles d'écriture
- Français partout : interface, contenus, commentaires, commits. Jamais de tiret cadratin dans les textes (utiliser virgule, deux-points, parenthèses).
- Ton envers les clientes : chaleureux, direct, sans injonction, tutoiement. Jamais de vocabulaire médical ni de ton « coach Instagram ».
- Le prénom de Cloé s'écrit sans H.

## Produit
- Trois rôles : `cliente` (voit uniquement son espace), `coach` (Cloé, voit tout), `relecteur` (Émilien, voit tout comme Cloé, écrit ses retours invisibles pour la cliente).
- Une notion de `programme` existe dès le schéma (B&I individuel aujourd'hui, Présente ! en groupe demain) mais on ne construit que B&I.
- Pas de gamification : pas de badges, pas de streaks. Le « chemin » est un visuel simple d'étapes avec mots clés et moments forts.
- Notifications clientes minimales : email à la publication d'une série de pratiques, rappel 3 jours avant la séance. Rappels pour Cloé uniquement dans le tableau de bord, plus un événement Google Agenda à J+7 pour l'envoi des pratiques.

## Technique
- Next.js App Router, TypeScript strict, Server Components par défaut, Server Actions pour les écritures.
- Supabase : toute table a la Row Level Security activée. Une cliente ne lit et n'écrit que ses propres lignes. `retours` (Émilien) et `seances.transcript_brut` ne sont jamais exposés aux clientes. Le client `service_role` ne s'utilise que côté serveur.
- Secrets dans Vercel uniquement (Doppler abandonné). En local : `vercel env pull .env.local --environment=production`, puis `npm run dev` et les scripts lisent `.env.local`. Aucun secret dans le code, aucun fichier `.env` commité, aucun secret collé dans le chat. Variables : `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_PASSWORD`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `DEEPGRAM_API_KEY`, `NEXT_PUBLIC_APP_URL`.
- Migrations SQL dans `supabase/migrations/`, jamais de modification de schéma à la main dans le dashboard sans migration correspondante.
- Emails : Resend, expéditeur `parcours@amarecherche.fr`, templates en React Email dans `src/emails/`.
- Fichiers (audio, PDF, photos) dans Supabase Storage, buckets privés, URLs signées.

## Charte (amarecherche.fr)
- Crème `#F5EDE3` (fond), violet `#59114D`, rouge `#E6361D`, corail `#FF6F52`, beige carte `#E8DDD0`, noir `#111111`, gris `#888888`.
- Titres : League Spartan. Texte : DM Sans. Libre Baskerville italic avec parcimonie, aux places prévues par les maquettes de `design/` (dates, citations de la cliente, mots de Cloé sur les ressources).
- Logo : « blocages » en minuscules League Spartan violet, « & INTUITION » en police Chloe rouge, poids visuel égal.
- Compositions propres et homogènes, animations légères sur les blocs, mobile d'abord (les clientes consultent souvent sur téléphone).

## Organisation du code
- `src/app/(cliente)/` espace cliente, `src/app/(coach)/` espace Cloé et Émilien, `src/app/api/` routes techniques (transcription, webhooks).
- `src/lib/supabase/` clients (navigateur, serveur, service), `src/lib/db/` requêtes typées, `src/content/` textes fixes (à propos, emails types).
- Types générés depuis Supabase dans `src/lib/supabase/types.ts` (`npm run db:types`).
