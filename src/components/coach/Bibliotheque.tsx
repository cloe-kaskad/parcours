"use client";

import { useState } from "react";
import Image from "next/image";
import { creerRessource, modifierRessource, partagerRessource } from "@/lib/actions/ressources";
import { libelleType, ORDRE_FILTRES } from "@/lib/ressources";
import type { Ressource, RessourceType } from "@/lib/supabase/types";
import { Depliant, FormAction } from "./interactifs";

type Infos = { url: string; type: RessourceType; titre: string; auteur: string; description: string; image: string | null };
type Choix = { parcoursId: string; prenom: string };

const TYPES: [RessourceType, string][] = [
  ["podcast", "Podcast"],
  ["video", "Vidéo"],
  ["lecture", "Lecture"],
  ["film", "Film"],
  ["autre", "Autre"],
];

function ChoixType({ valeur }: { valeur: RessourceType }) {
  return (
    <label className="etiquette">
      type
      <select name="type" defaultValue={valeur === "pdf" ? "lecture" : valeur} className="champ">
        {TYPES.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ColleUnLien() {
  const [lien, setLien] = useState("");
  const [infos, setInfos] = useState<Infos | null>(null);
  const [message, setMessage] = useState("");
  const [cle, setCle] = useState(0);

  async function lire(url: string) {
    if (!url.trim()) return;
    setMessage("Je regarde ce lien…");
    setInfos(null);
    const r = await fetch("/api/lien", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url }) }).catch(() => null);
    const d = r ? await r.json().catch(() => null) : null;
    if (!r?.ok || !d) return setMessage(d?.erreur ?? "Ce lien n’a pas pu être lu.");
    setMessage("");
    setInfos(d);
    setCle((n) => n + 1);
  }

  return (
    <div className="flex flex-col gap-2 pt-3.5">
      <label className="etiquette">
        Coller un lien
        <input
          type="url"
          placeholder="https://…"
          value={lien}
          onChange={(e) => setLien(e.target.value)}
          onPaste={(e) => lire(e.clipboardData.getData("text"))}
          onKeyDown={(e) => e.key === "Enter" && lire(lien)}
          onBlur={() => !infos && lire(lien)}
          className="min-h-[48px] w-full rounded-[6px] bg-beige px-3.5 py-3 text-[16px] text-encre outline-none"
        />
      </label>
      {message ? <p className="text-[12px] text-violet">{message}</p> : <p className="text-[12px] text-violet/70">Image, titre, auteur et description sont récupérés. Tu corriges la description, tu enregistres.</p>}
      {infos ? (
        <FormAction key={cle} action={creerRessource} bouton="Enregistrer" rouge className="rounded-[4px] border border-violet/20 p-4">
          {infos.image ? <Image src={infos.image} alt="" width={346} height={150} unoptimized className="h-[150px] w-full rounded-[2px] object-cover" /> : null}
          <input type="hidden" name="url" value={infos.url} />
          <input type="hidden" name="image_url" value={infos.image ?? ""} />
          <ChoixType valeur={infos.type} />
          <label className="etiquette">
            titre
            <input name="titre" defaultValue={infos.titre} className="champ" />
          </label>
          <label className="etiquette">
            auteur
            <input name="auteur" defaultValue={infos.auteur} className="champ" />
          </label>
          <label className="etiquette">
            description
            <textarea name="description" defaultValue={infos.description} className="champ-zone min-h-[90px]" />
          </label>
        </FormAction>
      ) : null}
    </div>
  );
}

export function PartagerAvec({ ressourceId, choix }: { ressourceId: string; choix: Choix[] }) {
  return (
    <div className="outils-nus">
      <Depliant libelle="Partager avec… →" principal>
        <FormAction action={partagerRessource} bouton="Partager" rouge>
          <input type="hidden" name="ressource_id" value={ressourceId} />
          <label className="etiquette">
            avec
            <select name="parcours_id" className="champ">
              {choix.map((c) => (
                <option key={c.parcoursId} value={c.parcoursId}>
                  {c.prenom}
                </option>
              ))}
            </select>
          </label>
          <label className="etiquette">
            ton mot, pourquoi pour elle
            <textarea name="pourquoi" className="champ-zone min-h-[90px]" />
          </label>
        </FormAction>
      </Depliant>
    </div>
  );
}

export function ModifierRessource({ r }: { r: Ressource }) {
  return (
    <div className="outils-nus">
      <Depliant libelle="Modifier">
        <FormAction action={modifierRessource} bouton="Enregistrer">
          <input type="hidden" name="id" value={r.id} />
          <ChoixType valeur={r.type} />
          <label className="etiquette">
            titre
            <input name="titre" defaultValue={r.titre} className="champ" />
          </label>
          <label className="etiquette">
            auteur
            <input name="auteur" defaultValue={r.auteur} className="champ" />
          </label>
          <label className="etiquette">
            description
            <textarea name="description" defaultValue={r.description} className="champ-zone min-h-[90px]" />
          </label>
        </FormAction>
      </Depliant>
    </div>
  );
}

export function GrilleBibliotheque({ cartes }: { cartes: { id: string; type: RessourceType; contenu: React.ReactNode }[] }) {
  const [courant, setCourant] = useState("Tous");
  const presents = new Set(cartes.map((c) => libelleType(c.type)));
  return (
    <>
      <div className="flex flex-wrap gap-2 pt-6">
        {["Tous", ...ORDRE_FILTRES.filter((f) => presents.has(f))].map((f) => (
          <button key={f} type="button" className="source" aria-pressed={courant === f} onClick={() => setCourant(f)}>
            {f}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-4 pb-[60px] pt-[26px] md:grid md:grid-cols-2 md:gap-6">
        {cartes.filter((c) => courant === "Tous" || libelleType(c.type) === courant).map((c) => (
          <div key={c.id}>{c.contenu}</div>
        ))}
      </div>
    </>
  );
}
