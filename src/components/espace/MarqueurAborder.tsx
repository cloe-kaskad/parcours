"use client";

import { useOptimistic, useTransition } from "react";
import { marquerAAborder } from "@/lib/actions/cliente";
import { avecReseau } from "@/lib/reseau";

// Le marqueur « à aborder en séance » : un geste, sur n'importe quelle entrée.
export function MarqueurAborder({ id, marque, lectureSeule = false }: { id: string; marque: boolean; lectureSeule?: boolean }) {
  const [valeur, changer] = useOptimistic(marque);
  const [, demarrer] = useTransition();
  return (
    <button
      type="button"
      aria-pressed={valeur}
      disabled={lectureSeule}
      onClick={() =>
        demarrer(async () => {
          changer(!valeur);
          await avecReseau(() => marquerAAborder(id, !valeur));
        })
      }
      className={`geste-etendu relative ml-auto shrink-0 font-titre text-[14px] font-semibold ${valeur ? "text-rouge" : "text-violet/45"}`}
    >
      ● à aborder en séance
    </button>
  );
}
