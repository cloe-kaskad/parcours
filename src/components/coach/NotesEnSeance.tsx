"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { enregistrerNotesSeance } from "@/lib/actions/seances";

const horloge = (s: number) => [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((n) => String(n).padStart(2, "0")).join(":");

// Les notes pendant la séance : un chrono depuis l'ouverture, chaque nouvelle ligne datée, enregistrement continu.
export function NotesEnSeance({ seanceId, initial }: { seanceId: string; initial: string }) {
  const [notes, setNotes] = useState(initial);
  const [secondes, setSecondes] = useState(0);
  const [etat, setEtat] = useState("rangées dans la séance, au fil de l’eau");
  const [, demarrer] = useTransition();
  const zone = useRef<HTMLTextAreaElement>(null);
  const minuterie = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const debut = Date.now();
    const t = setInterval(() => setSecondes(Math.floor((Date.now() - debut) / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  const enregistrer = (v: string) => {
    setNotes(v);
    setEtat("…");
    if (minuterie.current) clearTimeout(minuterie.current);
    minuterie.current = setTimeout(() => {
      demarrer(async () => {
        const r = await enregistrerNotesSeance(seanceId, v);
        setEtat(r.ok ? "enregistré" : (r.message ?? ""));
      });
    }, 900);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="surtitre m-0 text-violet">Notes pendant la séance</h2>
        <span className="font-titre text-[18px] font-semibold tabular-nums text-violet">{horloge(secondes)}</span>
      </div>
      <textarea
        ref={zone}
        value={notes}
        aria-label="Notes pendant la séance"
        placeholder="Entrée : une nouvelle ligne, avec l’heure de la séance."
        onChange={(e) => enregistrer(e.target.value)}
        onKeyDown={(e) => {
          if (e.key !== "Enter" || e.shiftKey) return;
          e.preventDefault();
          const el = e.currentTarget;
          const insere = `\n[${horloge(secondes)}] `;
          const v = notes.slice(0, el.selectionStart) + insere + notes.slice(el.selectionEnd);
          const pos = el.selectionStart + insere.length;
          enregistrer(v);
          requestAnimationFrame(() => zone.current?.setSelectionRange(pos, pos));
        }}
        className="champ-zone min-h-[46vh] text-[17px] leading-[1.6]"
      />
      <p role="status" className="m-0 text-[14px] text-violet/85">
        {etat}
      </p>
    </div>
  );
}
