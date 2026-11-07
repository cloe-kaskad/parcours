# parcours, plateforme Blocages & Intuition

Espace en ligne des clientes de Blocages & Intuition et tableau de bord de Cloé. Remplace Notion.

Adresse : https://parcours.amarecherche.fr

## Stack

- Next.js 16 (App Router, TypeScript, Tailwind 4) sur Vercel
- Supabase : base Postgres, authentification par lien magique, stockage des fichiers
- OpenAI : transcription des séances ; Anthropic : formatage des transcripts
- Resend : emails transactionnels (expéditeur parcours@amarecherche.fr)
- Secrets : dans Vercel uniquement (jamais dans le code). En local, ils sont copiés dans `.env.local` (ignoré par git).

## Démarrer en local

```bash
npm install
vercel link --project parcours   # une fois
vercel env pull .env.local --environment=production
npm run dev
```

## Base de données

Les migrations SQL sont dans `supabase/migrations/`, dans l'ordre. Pour appliquer une migration : Supabase > SQL Editor > coller le fichier > Run. Ne jamais modifier le schéma à la main sans migration correspondante.

## Comptes

Les comptes sont créés par Cloé (Supabase > Authentication > Users > Add user, ou plus tard depuis le tableau de bord). Une adresse non invitée ne peut pas se connecter. Le rôle (`cliente`, `coach`, `relecteur`) est dans la table `profiles`.

## Documentation

La spécification fonctionnelle (rôles, schéma de données, règles du tableau de bord, boucle transcript, plan de migration) est dans le projet Claude « Blocages & Intuition », doc `claude/plateforme-parcours-spec-v1.md`.

## Migration depuis Notion

Le script `scripts/migrer-notion.ts` lit l'export Notion (Markdown & CSV, décompressé) et crée pour chaque cliente : son compte, son parcours (intention), ses séances avec les transcripts en pièce jointe, ses envois d'exercices passés, ses ressources, ses notes libres (dans le journal) et son feedback.

1. Copier `scripts/clientes.exemple.json` en `scripts/clientes.json` et remplir les emails (fichier ignoré par git).
2. Lecture à blanc : `npx tsx scripts/migrer-notion.ts --dry --export "/chemin/vers/Export-…" --clientes scripts/clientes.json`
3. Migration : `npx tsx scripts/migrer-notion.ts --export "/chemin/vers/Export-…" --clientes scripts/clientes.json`
4. Vérification en lecture seule : `npx tsx scripts/verifier-migration.ts`

Options : `--cliente Déborah` pour une seule cliente, `--force` pour réimporter une cliente déjà migrée (efface ses séances, exercices, ressources partagées, journal et feedback importés).

Non migré : les images (photos déposées par les clientes), les dates de séances (à saisir sur chaque séance), les exercices dont la mise en page Notion ne suit pas le format « Pratique N : titre » (ils restent lisibles dans le mot d'accompagnement).
