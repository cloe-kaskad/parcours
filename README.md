# parcours, plateforme Blocages & Intuition

Espace en ligne des clientes de Blocages & Intuition et tableau de bord de Cloé. Remplace Notion.

Adresse : https://parcours.amarecherche.fr

## Stack

- Next.js (App Router, TypeScript) sur Vercel
- Supabase : base Postgres, authentification par lien magique, stockage des fichiers
- OpenAI : transcription des séances ; Anthropic : formatage des transcripts
- Resend : emails transactionnels (expéditeur parcours@amarecherche.fr)
- Doppler : secrets (jamais dans le code)

## Démarrer en local

```bash
npm install
doppler run -- npm run dev
```

## Documentation

La spécification fonctionnelle (rôles, schéma de données, règles du tableau de bord, boucle transcript, plan de migration) est dans le projet Claude « Blocages & Intuition », doc `claude/plateforme-parcours-spec-v1.md`. Les décisions importantes sont reportées dans `docs/` au fil de la construction.
