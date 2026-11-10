"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { creerDepot, type GenreDepot } from "@/lib/actions/depots";
import type { Resultat } from "@/lib/actions/clientes";
import { createClient } from "@/lib/supabase/client";

// Un formulaire qui s'ouvre en place, jamais une page à part.
export function Depliant({ libelle, principal = false, classeBouton, children }: { libelle: string; principal?: boolean; classeBouton?: string; children: React.ReactNode }) {
  const [ouvert, setOuvert] = useState(false);
  return (
    <>
      <button type="button" aria-expanded={ouvert} onClick={() => setOuvert(!ouvert)} className={classeBouton ?? (principal ? "text-rouge" : "")}>
        {libelle}
      </button>
      {ouvert ? <div className="order-last flex w-full basis-full flex-col gap-3 py-2 text-encre">{children}</div> : null}
    </>
  );
}

export function FormAction({
  action,
  bouton,
  children,
  className = "",
  rouge = false,
}: {
  action: (p: Resultat | null, fd: FormData) => Promise<Resultat>;
  bouton: string;
  children: React.ReactNode;
  className?: string;
  rouge?: boolean;
}) {
  const [etat, envoyer, enCours] = useActionState(action, null);
  return (
    <form action={envoyer} className={`flex flex-col gap-3 ${className}`}>
      {children}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={enCours} className={`${rouge ? "bouton-rouge" : "bouton-fantome"} disabled:opacity-50`}>
          {enCours ? "Un instant…" : bouton}
        </button>
        {etat?.message ? (
          <span role="status" className={`text-[13px] ${etat.ok ? "text-violet" : "text-rouge"}`}>
            {etat.message}
          </span>
        ) : null}
      </div>
    </form>
  );
}

// Dépôt direct vers Storage : le fichier ne passe jamais par le serveur.
export function DepotFichier({
  genre,
  cible,
  accept,
  titre,
  aide,
  apres,
  avecTitre = false,
}: {
  genre: GenreDepot;
  cible: string;
  accept: string;
  titre: string;
  aide: string;
  apres: (chemin: string, duree: number | null, libelle: string) => Promise<Resultat>;
  avecTitre?: boolean;
}) {
  const [message, setMessage] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [libelle, setLibelle] = useState("");
  const router = useRouter();

  function dureeAudio(f: File) {
    return new Promise<number | null>((resolve) => {
      if (genre !== "audio") return resolve(null);
      const a = new Audio(URL.createObjectURL(f));
      a.onloadedmetadata = () => resolve(Number.isFinite(a.duration) ? Math.round(a.duration) : null);
      a.onerror = () => resolve(null);
    });
  }

  async function envoyer(f: File | undefined) {
    if (!f) return;
    setEnCours(true);
    setMessage("Envoi en cours, garde cette page ouverte…");
    try {
      const depot = await creerDepot(genre, cible, f.name);
      if (!depot.ok) return setMessage(depot.message);
      const duree = await dureeAudio(f);
      const { error } = await createClient().storage.from(depot.bucket).uploadToSignedUrl(depot.chemin, depot.token, f);
      if (error) return setMessage("L’envoi n’a pas abouti. Réessaie, avec une bonne connexion.");
      const r = await apres(depot.chemin, duree, libelle);
      setMessage(r.message ?? "");
      router.refresh();
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="flex w-full flex-col gap-2">
      {avecTitre ? (
        <label className="etiquette">
          titre de la note
          <input className="champ" value={libelle} onChange={(e) => setLibelle(e.target.value)} />
        </label>
      ) : null}
      <label
        className={`depot ${enCours ? "opacity-60" : ""}`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          envoyer(e.dataTransfer.files[0]);
        }}
      >
        <span className="font-titre text-[16px] font-semibold text-violet">{titre}</span>
        <span className="text-[12px] text-violet/80">{aide}</span>
        <input type="file" accept={accept} disabled={enCours} aria-label={titre} className="sr-only" onChange={(e) => envoyer(e.target.files?.[0])} />
      </label>
      {message ? (
        <p role="status" className="text-[13px] text-violet">
          {message}
        </p>
      ) : null}
    </div>
  );
}

function horloge(s: number) {
  if (!Number.isFinite(s)) return "0:00";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const c = String(Math.floor(s % 60)).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${c}` : `${m}:${c}`;
}

export function LecteurAudio({ src, dureeConnue }: { src: string; dureeConnue: number | null }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [lecture, setLecture] = useState(false);
  const [position, setPosition] = useState(0);
  const [duree, setDuree] = useState(dureeConnue ?? 0);
  return (
    <div className="flex items-center gap-3 rounded-[10px] bg-beige px-3 py-2.5">
      <audio ref={audio} src={src} preload="metadata" onTimeUpdate={(e) => setPosition(e.currentTarget.currentTime)} onLoadedMetadata={(e) => setDuree(e.currentTarget.duration)} onPlay={() => setLecture(true)} onPause={() => setLecture(false)} />
      <button
        type="button"
        aria-label={lecture ? "Mettre en pause" : "Écouter"}
        onClick={() => (lecture ? audio.current?.pause() : audio.current?.play())}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-violet"
      >
        <svg aria-hidden="true" width="14" height="14" viewBox="0 0 16 16" fill="#F5EDE3">
          {lecture ? <path d="M3 2h4v12H3zM9 2h4v12H9z" /> : <path d="M4 2 L14 8 L4 14 Z" />}
        </svg>
      </button>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <input
          type="range"
          min={0}
          max={duree || 0}
          value={position}
          aria-label="Position dans l’audio"
          onChange={(e) => {
            if (audio.current) audio.current.currentTime = Number(e.target.value);
          }}
          className="h-1 w-full accent-violet"
        />
        <div className="flex justify-between text-[11px] text-violet">
          <span>{horloge(position)}</span>
          <span>{horloge(duree)}</span>
        </div>
      </div>
    </div>
  );
}

export function Confirmer({ action, libelle, question, valeurs }: { action: (fd: FormData) => Promise<void>; libelle: string; question: string; valeurs: Record<string, string> }) {
  const [demande, setDemande] = useState(false);
  const [enCours, demarrer] = useTransition();
  if (!demande) {
    return (
      <button type="button" onClick={() => setDemande(true)} className="text-[13px] text-violet underline">
        {libelle}
      </button>
    );
  }
  return (
    <span className="inline-flex flex-wrap items-center gap-3 text-[13px] text-violet">
      {question}
      <button
        type="button"
        disabled={enCours}
        className="font-semibold text-rouge underline"
        onClick={() =>
          demarrer(async () => {
            const fd = new FormData();
            Object.entries(valeurs).forEach(([k, v]) => fd.set(k, v));
            await action(fd);
            setDemande(false);
          })
        }
      >
        Oui
      </button>
      <button type="button" onClick={() => setDemande(false)} className="underline">
        annuler
      </button>
    </span>
  );
}
