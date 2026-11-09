"use client";

import { useState } from "react";

type Carte = { id: string; filtre: string; contenu: React.ReactNode };

export function FiltresRessources({ filtres, cartes }: { filtres: string[]; cartes: Carte[] }) {
  const [courant, setCourant] = useState("Tous");
  return (
    <>
      <div className="flex flex-wrap gap-2 px-[22px] pt-6 md:px-10">
        {["Tous", ...filtres].map((f) => (
          <button key={f} type="button" className="filtre" aria-pressed={courant === f} onClick={() => setCourant(f)}>
            {f}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-4 px-[22px] pb-[60px] pt-[26px] md:grid md:grid-cols-3 md:gap-6 md:px-10 md:pt-8">
        {cartes.filter((c) => courant === "Tous" || c.filtre === courant).map((c) => (
          <div key={c.id} className="flex">
            {c.contenu}
          </div>
        ))}
      </div>
    </>
  );
}
