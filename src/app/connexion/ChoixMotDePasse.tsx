"use client";

import { useActionState } from "react";
import { choisirMotDePasse, type EtatMotDePasse } from "./actions";

// Choisir son mot de passe : douze caractères au moins, tapé deux fois. Cloé ne le voit jamais.
export function ChoixMotDePasse({ surPapier = false }: { surPapier?: boolean }) {
  const [etat, action, enCours] = useActionState<EtatMotDePasse, FormData>(choisirMotDePasse, { statut: "idle" });
  const couleur = surPapier ? "text-violet" : "text-rose";
  const champ = `min-h-[44px] w-full border-b bg-transparent pb-3 pt-2.5 text-[18px] outline-none ${surPapier ? "border-violet/40 text-encre" : "border-creme/50 text-creme"}`;
  return (
    <form action={action} className="flex flex-col gap-5">
      <label className={`flex flex-col gap-1.5 text-[14px] ${couleur}`}>
        nouveau mot de passe (douze caractères au moins)
        <input type="password" name="mot_de_passe" required minLength={12} autoComplete="new-password" className={champ} />
      </label>
      <label className={`flex flex-col gap-1.5 text-[14px] ${couleur}`}>
        le même, une seconde fois
        <input type="password" name="confirmation" required minLength={12} autoComplete="new-password" className={champ} />
      </label>
      {etat.statut === "erreur" ? (
        <p role="alert" className={`text-[15px] ${surPapier ? "text-rouge" : "text-rose"}`}>
          {etat.message}
        </p>
      ) : null}
      <button type="submit" disabled={enCours} className="t-action min-h-[52px] self-start rounded-full bg-rouge px-6 pb-3.5 pt-4 text-[18px] text-creme disabled:opacity-60">
        {enCours ? "Un instant…" : "Enregistrer mon mot de passe"}
      </button>
    </form>
  );
}
