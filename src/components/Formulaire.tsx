"use client";

import { useActionState, type ReactNode } from "react";
import type { Resultat } from "@/lib/actions/clientes";
import { Bouton, Message } from "./ui";

type Action = (prev: Resultat | null, fd: FormData) => Promise<Resultat>;

// Formulaire branché sur une action serveur, avec message de retour et bouton d'envoi.
export function Formulaire({
  action,
  bouton,
  variante = "primaire",
  className = "",
  enLigne = false,
  children,
}: {
  action: Action;
  bouton: string;
  variante?: "primaire" | "secondaire" | "danger";
  className?: string;
  enLigne?: boolean;
  children?: ReactNode;
}) {
  const [etat, formAction, enCours] = useActionState(action, null);
  return (
    <form action={formAction} className={enLigne ? `flex flex-wrap items-end gap-3 ${className}` : `flex flex-col gap-4 ${className}`}>
      {children}
      {etat ? <Message type={etat.ok ? "ok" : "erreur"}>{etat.message}</Message> : null}
      <div>
        <Bouton type="submit" variante={variante} disabled={enCours}>
          {enCours ? "…" : bouton}
        </Bouton>
      </div>
    </form>
  );
}
