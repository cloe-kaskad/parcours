"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { proposerVersionSeance } from "@/lib/actions/seances";

export type EtatVersion = "sans-migration" | "aucune" | "a-jour" | "changee";

// Sous « Ma préparation » : la version séance, proposée depuis la préparation puis modifiable.
export function VersionSeance({ seanceId, modifier, etat, date, sections }: { seanceId: string; modifier: string; etat: EtatVersion; date: string | null; sections: number }) {
  const [message, setMessage] = useState("");
  const [enCours, demarrer] = useTransition();

  if (etat === "sans-migration") {
    return <p className="m-0 text-[14px] text-violet/85">Version séance : en attente de la migration 0008.</p>;
  }

  return (
    <div className="flex flex-col gap-2 border-t border-[var(--filet-papier)] pt-3.5">
      <h3 className="surtitre m-0 text-violet">Version séance</h3>
      <p className="m-0 text-[15px] leading-[1.5] text-encre">
        {etat === "aucune"
          ? "La préparation allégée pour la séance : mêmes sections, même ordre, textes à lire gardés en entier."
          : etat === "changee"
            ? "La préparation a changé depuis la version séance. Reproposer ?"
            : `${sections} section${sections > 1 ? "s" : ""}${date ? `, proposée ou modifiée le ${date}` : ""}.`}
      </p>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <button
          type="button"
          disabled={enCours}
          onClick={() => {
            setMessage("Proposition en cours, une minute environ…");
            demarrer(async () => {
              const r = await proposerVersionSeance(seanceId);
              setMessage(r.message ?? "");
            });
          }}
          className={`${etat === "a-jour" ? "outil" : "pilule pilule-rouge"} min-h-[44px] disabled:opacity-60`}
        >
          {etat === "aucune" ? "Proposer la version séance" : "Reproposer"}
        </button>
        {etat !== "aucune" ? (
          <Link href={modifier} className="outil inline-flex min-h-[44px] items-center text-[14px]">
            Modifier section par section
          </Link>
        ) : null}
      </div>
      {message ? (
        <p role="status" className="m-0 text-[14px] leading-[1.45] text-violet">
          {message}
        </p>
      ) : null}
    </div>
  );
}
