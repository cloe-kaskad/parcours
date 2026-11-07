"use client";

import { useActionState } from "react";
import { envoyerLien, type EtatConnexion } from "./actions";

export function FormulaireConnexion({ suite }: { suite?: string }) {
  const [etat, action, enCours] = useActionState<EtatConnexion, FormData>(envoyerLien, { statut: "idle" });

  if (etat.statut === "envoye") {
    return (
      <div className="bloc rounded-2xl bg-white/70 p-6">
        <h2 className="text-2xl font-bold">Le lien est parti.</h2>
        <p className="mt-3 text-base leading-relaxed">
          Regarde ta boîte mail à <strong>{etat.email}</strong>. Un clic sur le lien et tu es dans ton espace.
        </p>
        <p className="mt-3 text-sm text-gris">
          Rien reçu au bout de deux minutes ? Vérifie les indésirables, puis réessaie.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="bloc flex flex-col gap-4">
      {suite ? <input type="hidden" name="suite" value={suite} /> : null}
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-violet">Ton adresse email</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder="prenom@exemple.fr"
          className="rounded-xl border border-beige bg-white px-4 py-3 text-base outline-none transition focus:border-violet focus:ring-2 focus:ring-violet/20"
        />
      </label>
      {etat.statut === "erreur" ? (
        <p className="rounded-xl bg-rouge/10 px-4 py-3 text-sm text-rouge" role="alert">
          {etat.message}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={enCours}
        className="rounded-xl bg-violet px-5 py-3 text-base font-semibold text-white transition hover:bg-violet-clair disabled:opacity-60"
      >
        {enCours ? "Envoi en cours…" : "Recevoir mon lien de connexion"}
      </button>
      <p className="text-sm leading-relaxed text-gris">
        Pas de mot de passe : tu reçois un lien par email, valable une heure.
      </p>
    </form>
  );
}
