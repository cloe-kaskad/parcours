"use client";

import { useActionState, useState } from "react";
import { envoyerLienAcces } from "@/lib/actions/clientes";

// Le seul bouton qui écrit à la cliente : il demande toujours confirmation.
export function EnvoiLienAcces({ email, prenom }: { email: string; prenom: string }) {
  const [demande, setDemande] = useState(false);
  const [etat, envoyer, enCours] = useActionState(envoyerLienAcces, null);
  if (etat?.ok) return <p className="text-[13px] text-rose">{etat.message}</p>;
  if (!demande) {
    return (
      <button type="button" onClick={() => setDemande(true)} className="t-action min-h-[44px] self-start text-[13px] text-rose">
        Lui envoyer son lien d’accès
      </button>
    );
  }
  return (
    <form action={envoyer} className="flex flex-col gap-2 text-[13px] text-creme">
      <input type="hidden" name="email" value={email} />
      <p>
        {prenom} va recevoir un email à l’adresse {email}. Tu confirmes ?
      </p>
      <div className="flex items-center gap-4">
        <button type="submit" disabled={enCours} className="bouton-rouge">
          {enCours ? "Un instant…" : "Oui, envoyer l’email"}
        </button>
        <button type="button" onClick={() => setDemande(false)} className="underline">
          annuler
        </button>
      </div>
      {etat && !etat.ok ? <p className="text-rose">{etat.message}</p> : null}
    </form>
  );
}
