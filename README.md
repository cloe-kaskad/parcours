# parcours, plateforme Blocages & Intuition

Espace en ligne des clientes de Blocages & Intuition et tableau de bord de Cloé. Remplace Notion.

Adresse : https://parcours.amarecherche.fr

## Stack

- Next.js 16 (App Router, TypeScript, Tailwind 4) sur Vercel
- Supabase : base Postgres, authentification par lien magique, stockage des fichiers
- OpenAI : transcription des séances ; Anthropic : formatage des transcripts
- Resend : emails transactionnels (expéditeur parcours@amarecherche.fr)
- Doppler : secrets (jamais dans le code). Les mêmes variables sont saisies à la main dans Vercel (pas de sync Doppler > Vercel, limite du plan gratuit).

## Démarrer en local

```bash
npm install
doppler setup   # une fois : projet parcours, config dev
doppler run -- npm run dev
```

## Base de données

Les migrations SQL sont dans `supabase/migrations/`, dans l'ordre. Pour appliquer une migration : Supabase > SQL Editor > coller le fichier > Run. Ne jamais modifier le schéma à la main sans migration correspondante.

## Comptes

Les comptes sont créés par Cloé (Supabase > Authentication > Users > Add user, ou plus tard depuis le tableau de bord). Une adresse non invitée ne peut pas se connecter. Le rôle (`cliente`, `coach`, `relecteur`) est dans la table `profiles`.

## Documentation

La spécification fonctionnelle (rôles, schéma de données, règles du tableau de bord, boucle transcript, plan de migration) est dans le projet Claude « Blocages & Intuition », doc `claude/plateforme-parcours-spec-v1.md`.
