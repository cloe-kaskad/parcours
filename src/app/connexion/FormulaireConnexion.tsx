"use client";

import { useActionState } from "react";
import { Bouton, Champ, Message } from "@/components/ui";
import { envoyerLien, type EtatConnexion } from "./actions";

export function FormulaireConnexion({ suite }: { suite?: string }) {
  const [etat, action, enCours] = useActionState<EtatConnexion, FormData>(envoyerLien, { statut: "idle" });

  if (etat.statut === "envoye") {
    return (
      <div>
        <h2 className="text-2xl font-bold">Le lien est parti.</h2>
        <p className="mt-3 text-base leading-relaxed">
          Regarde ta boîte mail à <strong>{etat.email}</strong>. Un clic sur le lien et tu es dans ton espace.
        </p>
        <p className="mt-3 text-sm text-texte-doux">Rien reçu au bout de deux minutes ? Vérifie les indésirables, puis réessaie.</p>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      {suite ? <input type="hidden" name="suite" value={suite} /> : null}
      <Champ label="Ton adresse email" type="email" name="email" required autoComplete="email" inputMode="email" placeholder="prenom@exemple.fr" />
      {etat.statut === "erreur" ? <Message type="erreur">{etat.message}</Message> : null}
      <Bouton type="submit" disabled={enCours} className="w-full py-3 text-base">
        {enCours ? "Envoi en cours…" : "Recevoir mon lien"}
      </Bouton>
      <p className="text-center text-sm leading-relaxed text-texte-doux">Pas de mot de passe. Un lien par email, valable une heure.</p>
    </form>
  );
}
