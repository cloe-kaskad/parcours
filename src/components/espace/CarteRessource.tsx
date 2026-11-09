import Image from "next/image";
import type { RessourceSuivi, RessourceType } from "@/lib/supabase/types";
import { titrePropre } from "@/lib/textes";
import { Papier } from "./Papier";
import { SuiviRessource } from "./SuiviRessource";

const TYPES: Record<RessourceType, string> = {
  podcast: "Podcast",
  video: "Vidéo",
  lecture: "Lecture",
  film: "Film",
  pdf: "Lecture",
  autre: "Ressource",
};

export function CarteRessource({
  affectationId,
  type,
  titre,
  auteur,
  mot,
  image,
  lien,
  statut,
}: {
  affectationId: string;
  type: RessourceType;
  titre: string;
  auteur: string;
  mot: string;
  image: string | null;
  lien: string | null;
  statut: RessourceSuivi["statut"];
}) {
  const nom = titrePropre(titre);
  return (
    <Papier className="flex w-[250px] shrink-0 flex-col overflow-hidden md:w-auto">
      {image ? <Image src={image} alt="" width={250} height={130} unoptimized className="h-[130px] w-full object-cover" /> : null}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="font-titre text-[11px] font-semibold uppercase tracking-[0.08em] text-rouge">{TYPES[type]}</p>
        <h3 className="t-carte [overflow-wrap:anywhere]">
          {lien ? (
            <a href={lien} target="_blank" rel="noreferrer">
              {nom}
            </a>
          ) : (
            nom
          )}
        </h3>
        {auteur ? <p className="text-[13px] text-encre/70">{auteur}</p> : null}
        {mot ? <p className="pt-1 font-italique text-[14px] italic leading-[1.5] text-violet">{mot}</p> : null}
        <div className="mt-auto flex flex-col">
          <SuiviRessource affectationId={affectationId} statut={statut} />
        </div>
      </div>
    </Papier>
  );
}
