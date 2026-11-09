import type { RessourceType } from "@/lib/supabase/types";
import { titrePropre } from "@/lib/textes";

const LIBELLES: Record<RessourceType, string> = {
  podcast: "Podcast",
  video: "Vidéo",
  lecture: "Lecture",
  film: "Film",
  pdf: "Lecture",
  autre: "Ressource",
};

export const libelleType = (type: RessourceType) => LIBELLES[type];

// Les filtres de la médiathèque, dans l'ordre des maquettes.
export const ORDRE_FILTRES = ["Podcast", "Vidéo", "Lecture", "Film", "Ressource"];

// D'où vient une entrée de carnet : un exercice, ou la fin d'une lettre.
export function origineEntree(e: { exercice: string | null; lettre: { id: string; titre: string } | null }) {
  if (!e.lettre) return null;
  const lettre = titrePropre(e.lettre.titre);
  return { texte: e.exercice ? `sous « ${titrePropre(e.exercice)} », ${lettre}` : `dans « ${lettre} »`, href: `/espace/lettre/${e.lettre.id}` };
}
