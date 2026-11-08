"use client";

import { useState } from "react";
import { envoyerLienAcces } from "@/lib/actions/clientes";
import { Formulaire } from "./Formulaire";
import { Bouton } from "./ui";

// L'envoi part vers la boîte mail de la cliente : il demande toujours une confirmation.
export function EnvoiLienAcces({ email, prenom }: { email: string; prenom: string }) {
  const [confirmer, setConfirmer] = useState(false);

  if (!confirmer) {
    return (
      <Bouton type="button" variante="discret" className="px-0!" onClick={() => setConfirmer(true)}>
        Lui envoyer son lien d’accès
      </Bouton>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-surface-douce p-4">
      <p className="text-sm leading-relaxed [overflow-wrap:anywhere]">
        {prenom} va recevoir un email à l’adresse {email}. Tu confirmes ?
      </p>
      <Formulaire action={envoyerLienAcces} bouton="Oui, envoyer l’email" variante="secondaire">
        <input type="hidden" name="email" value={email} />
      </Formulaire>
      <div>
        <Bouton type="button" variante="discret" className="px-0!" onClick={() => setConfirmer(false)}>
          Annuler
        </Bouton>
      </div>
    </div>
  );
}
