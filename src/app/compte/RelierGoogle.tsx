"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

// « Relier mon compte Google » : pour entrer avec Google même si l'adresse Google n'est pas celle du compte.
export function RelierGoogle() {
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState("");
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={enCours}
        onClick={async () => {
          setEnCours(true);
          setErreur("");
          const retour = new URL("/auth/callback", window.location.origin);
          retour.searchParams.set("suite", "/compte?google=relie");
          const { error } = await createClient().auth.linkIdentity({ provider: "google", options: { redirectTo: retour.toString() } });
          if (error) {
            setEnCours(false);
            setErreur("Le lien avec Google n’est pas disponible pour l’instant.");
          }
        }}
        className="bouton-fantome self-start disabled:opacity-60"
      >
        {enCours ? "Un instant…" : "Relier mon compte Google"}
      </button>
      {erreur ? (
        <p role="alert" className="text-[14px] text-rouge">
          {erreur}
        </p>
      ) : null}
    </div>
  );
}
