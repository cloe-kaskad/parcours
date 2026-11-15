"use client";

import { useState } from "react";
import { validerResume } from "@/lib/actions/seances";
import { FormAction } from "./interactifs";

// Le résumé d'une séance (cinq lignes) : validé, il s'affiche ; proposé, Cloé le valide ou le corrige.
// Émilien le lit, ne le modifie pas. Jamais visible par la cliente.
export function ResumeSeance({ seanceId, resume, propose, estCoach }: { seanceId: string; resume: string | null; propose: string | null; estCoach: boolean }) {
  const [edition, setEdition] = useState(false);
  const texte = resume?.trim() || "";
  const proposition = !texte ? propose?.trim() || "" : "";

  if (edition) {
    return (
      <FormAction action={validerResume} bouton="Valider le résumé" rouge>
        <input type="hidden" name="id" value={seanceId} />
        <textarea name="resume" aria-label="Le résumé de la séance" defaultValue={texte || proposition} className="champ-zone min-h-[140px]" />
      </FormAction>
    );
  }
  if (texte) {
    return (
      <div className="flex flex-col gap-1">
        <p className="m-0 whitespace-pre-line text-[15px] leading-[1.55] text-encre">{texte}</p>
        {estCoach ? (
          <button type="button" onClick={() => setEdition(true)} className="outil min-h-[44px] self-start">
            Modifier le résumé
          </button>
        ) : null}
      </div>
    );
  }
  if (proposition && estCoach) {
    return (
      <div className="flex flex-col gap-1.5 rounded-r-[6px] border-l-[3px] border-rouge pl-3">
        <span className="font-titre text-[14px] font-semibold text-rouge">Résumé proposé, à valider</span>
        <p className="m-0 whitespace-pre-line text-[15px] leading-[1.55] text-encre">{proposition}</p>
        <div className="flex flex-wrap items-center gap-x-4">
          <FormAction action={validerResume} bouton="Valider">
            <input type="hidden" name="id" value={seanceId} />
            <input type="hidden" name="resume" value={proposition} />
          </FormAction>
          <button type="button" onClick={() => setEdition(true)} className="outil min-h-[44px]">
            Corriger
          </button>
        </div>
      </div>
    );
  }
  return null;
}
