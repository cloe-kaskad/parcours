"use client";

import { useRef, useState, useTransition } from "react";
import { enregistrerPreparation } from "@/lib/actions/seances";
import { marquerALire, NOM_INTEGRAL, preparationLisible } from "@/lib/version-seance";
import { OuvrirLecture } from "./Liseuse";
import { TexteLecture } from "./TexteLecture";

// « Ma préparation » : la carte beige à filet rouge, en tête d'« Avant la séance ».
// Elle se lit en place ; « Modifier » ouvre l'édition, enregistrée toute seule.
// Vide, elle invite à coller la préparation faite avec Claude.
export function Preparation({ seanceId, initial, date }: { seanceId: string; initial: string; date: string | null }) {
  const [texte, setTexte] = useState(initial);
  const [edition, setEdition] = useState(!initial.trim());
  const [etat, setEtat] = useState("Enregistré automatiquement.");
  const [, demarrer] = useTransition();
  const minuterie = useRef<ReturnType<typeof setTimeout> | null>(null);
  const zone = useRef<HTMLTextAreaElement>(null);

  const changer = (v: string) => {
    setTexte(v);
    setEtat("modifications en cours…");
    if (minuterie.current) clearTimeout(minuterie.current);
    minuterie.current = setTimeout(() => {
      demarrer(async () => {
        const r = await enregistrerPreparation(seanceId, v);
        setEtat(r.ok ? "Enregistré automatiquement." : (r.message ?? ""));
      });
    }, 1200);
  };

  // « Texte à lire en entier » : le passage sélectionné sera gardé mot pour mot dans la version séance.
  const marquer = () => {
    const el = zone.current;
    if (!el || el.selectionStart === el.selectionEnd) {
      setEtat("Sélectionne d’abord le texte à lire en entier (une visualisation, un texte guidé…).");
      return;
    }
    const r = marquerALire(texte, el.selectionStart, el.selectionEnd);
    changer(r.texte);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(r.curseur, r.curseur);
    });
  };

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="surtitre m-0 text-rouge">Ma préparation</h2>
        {!edition ? (
          <button type="button" onClick={() => setEdition(true)} className="outil min-h-[44px] text-[14px]">
            Modifier
          </button>
        ) : texte.trim() ? (
          <button type="button" onClick={() => setEdition(false)} className="outil min-h-[44px] text-[14px]">
            Lire
          </button>
        ) : null}
      </div>
      {edition ? (
        <>
          <textarea
            ref={zone}
            aria-label="Ma préparation"
            value={texte}
            placeholder="Colle ici la préparation faite avec Claude (le Markdown est gardé : titres, gras, listes)."
            onChange={(e) => changer(e.target.value)}
            className="champ-zone min-h-[220px] bg-papier text-[16px] leading-[1.6]"
          />
          {texte.trim() ? (
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={marquer} className="outil self-start min-h-[44px] text-[14px]">
              {NOM_INTEGRAL}
            </button>
          ) : null}
          <p role="status" className="m-0 text-[14px] text-violet/85">
            {etat}
          </p>
        </>
      ) : (
        <>
          {/* Téléphone : le début, puis « Lire en entier » dans la liseuse. Ordinateur : la colonne défile. */}
          <div className="relative max-h-[22rem] overflow-hidden lg:max-h-[calc(100vh-190px)] lg:overflow-y-auto">
            <TexteLecture className="text-[16px]">{preparationLisible(texte)}</TexteLecture>
            <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-carte to-transparent lg:hidden" />
          </div>
          {texte === initial ? (
            <OuvrirLecture cle="prepa" className="self-start text-violet lg:hidden">
              Lire en entier →
            </OuvrirLecture>
          ) : null}
          <p className="m-0 text-[14px] text-violet/85">{date ? `${date} · ` : ""}toi seule</p>
        </>
      )}
    </div>
  );
}

// « Copier le dossier pour Claude » : tout le dossier de la séance dans le presse-papiers, en Markdown.
export function CopierDossier({ dossier, fantome = false }: { dossier: string; fantome?: boolean }) {
  const [etat, setEtat] = useState<"" | "copie" | "echec">("");
  return (
    <div className="flex flex-col items-start gap-1.5">
      <button
        type="button"
        className={fantome ? "bouton-fantome" : "pilule pilule-rouge min-h-[44px]"}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(dossier);
            setEtat("copie");
          } catch {
            setEtat("echec");
          }
        }}
      >
        Copier le dossier pour Claude
      </button>
      <p role="status" className={`m-0 text-[14px] leading-[1.45] text-violet/85 ${fantome && !etat ? "sr-only" : ""}`}>
        {etat === "copie"
          ? "Copié. Colle-le dans ton projet B&I et demande ta préparation."
          : etat === "echec"
            ? "La copie n’a pas marché : réessaie, la page doit être au premier plan."
            : "Lettre et notes, carnet, météos, ressources, retour d’Émilien, transcript, chemin, préparation précédente."}
      </p>
    </div>
  );
}
