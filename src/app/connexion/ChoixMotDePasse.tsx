"use client";

import { useActionState } from "react";
import { BandeauMessage } from "./FormulaireConnexion";
import { choisirMotDePasse, type EtatMotDePasse } from "./actions";

// « Choisis ton mot de passe » (maquette F-v2, état 5) : huit caractères au moins, tapé deux fois,
// puis on entre. Cloé ne le voit jamais.
export function ChoixMotDePasse() {
  const [etat, action, enCours] = useActionState<EtatMotDePasse, FormData>(choisirMotDePasse, { statut: "idle" });
  const champ = "min-h-[44px] w-full border-b border-creme/50 bg-transparent pb-3 pt-2.5 text-[18px] text-creme outline-none";
  return (
    <form action={action} className="flex flex-col gap-5">
      <label className="flex flex-col gap-1.5 text-[14px] text-rose">
        nouveau mot de passe
        <input type="password" name="mot_de_passe" required minLength={8} autoComplete="new-password" className={champ} />
      </label>
      <label className="flex flex-col gap-1.5 text-[14px] text-rose">
        encore une fois
        <input type="password" name="confirmation" required minLength={8} autoComplete="new-password" className={champ} />
      </label>
      <BandeauMessage message={etat.statut === "erreur" ? { message: etat.message } : null} />
      <button type="submit" disabled={enCours} className="t-action min-h-[52px] self-start rounded-full bg-rouge px-6 pb-3.5 pt-4 text-[18px] text-creme disabled:opacity-60">
        {enCours ? "Un instant…" : "Enregistrer et entrer"}
      </button>
    </form>
  );
}
