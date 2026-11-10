"use client";

import { useState } from "react";
import { enregistrerNoteEquipe } from "@/lib/actions/equipe";
import { FormAction } from "./interactifs";

// La note de parcours : lue d'abord, modifiée sur place.
export function NoteParcours({ parcoursId, texte, signature }: { parcoursId: string; texte: string; signature: string | null }) {
  const [edition, setEdition] = useState(false);
  if (edition || !texte.trim()) {
    return (
      <FormAction action={enregistrerNoteEquipe} bouton="Enregistrer">
        <input type="hidden" name="parcours_id" value={parcoursId} />
        <textarea name="note" aria-label="Note de parcours" defaultValue={texte} placeholder="Où elle en est, en quelques lignes, pour Cloé et Émilien." className="champ-zone min-h-[140px]" />
        <span className="text-[12px] text-violet/75">Jamais visible par elle.</span>
      </FormAction>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <p className="whitespace-pre-line text-[15px] leading-[1.6]">{texte}</p>
      <div className="flex flex-wrap items-center gap-x-4 text-[12px] text-violet/80">
        {signature ? <span className="font-italique italic">{signature}</span> : null}
        <button type="button" onClick={() => setEdition(true)} className="t-action min-h-[44px] text-[13px] text-violet underline">
          Modifier
        </button>
      </div>
    </div>
  );
}

// Un texte long replié après quelques lignes.
export function TexteReplie({ texte, className = "" }: { texte: string; className?: string }) {
  const [ouvert, setOuvert] = useState(false);
  const long = texte.length > 280 || texte.split("\n").length > 5;
  return (
    <div className="flex flex-col gap-1">
      <p className={`whitespace-pre-line text-[14px] leading-[1.55] ${!ouvert && long ? "line-clamp-5" : ""} ${className}`}>{texte}</p>
      {long ? (
        <button type="button" onClick={() => setOuvert(!ouvert)} className="self-start min-h-[44px] text-[12px] text-violet underline">
          {ouvert ? "replier" : "lire la suite"}
        </button>
      ) : null}
    </div>
  );
}
