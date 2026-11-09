"use client";

import { useState, useTransition } from "react";
import { enregistrerMeteo } from "@/lib/actions/cliente";
import { Lecteur } from "./Lecteur";

type Etat = { code: string; libelle: string };
type Musique = { etat_code: string; titre: string; artiste: string; url: string };

export function ZoneMeteo({
  etats,
  etatInitial,
  noteInitiale,
  musiques,
  traces,
}: {
  etats: Etat[];
  etatInitial: string | null;
  noteInitiale: string;
  musiques: Musique[];
  traces: string[];
}) {
  const [courant, setCourant] = useState(etatInitial);
  const [note, setNote] = useState(noteInitiale);
  const [noteGardee, setNoteGardee] = useState(noteInitiale);
  const [, demarrer] = useTransition();
  const musique = musiques.find((m) => m.etat_code === courant);

  function enregistrer(etat: string, mot: string) {
    const fd = new FormData();
    fd.set("etat_code", etat);
    fd.set("note", mot);
    demarrer(() => enregistrerMeteo(fd));
  }

  return (
    <div className="flex flex-col gap-[18px]">
      <h2 className="t-meteo text-creme">Comment tu te sens, là ?</h2>
      <div className="flex flex-wrap gap-2">
        {etats.map((e) => (
          <button
            key={e.code}
            type="button"
            className="pastille"
            aria-pressed={courant === e.code}
            onClick={() => {
              if (courant === e.code) return;
              setCourant(e.code);
              enregistrer(e.code, note);
            }}
          >
            {e.libelle}
          </button>
        ))}
      </div>
      {courant ? (
        <div className="flex flex-col gap-3.5 pt-1.5">
          {musique ? <Lecteur titre={musique.titre} artiste={musique.artiste} url={musique.url} /> : null}
          <label className="block border-b border-creme/30 pb-1.5 font-italique text-[14px] italic text-creme/70">
            un mot de plus, si tu veux
            <input
              type="text"
              value={note}
              maxLength={280}
              onChange={(ev) => setNote(ev.target.value)}
              onBlur={() => {
                if (note === noteGardee) return;
                setNoteGardee(note);
                enregistrer(courant, note);
              }}
              className="block w-full bg-transparent pt-1.5 font-sans text-[16px] not-italic text-creme outline-none"
            />
          </label>
        </div>
      ) : null}
      {traces.length ? <p className="text-[11px] tracking-[0.02em] text-rose/60">{traces.join("   ")}</p> : null}
    </div>
  );
}
