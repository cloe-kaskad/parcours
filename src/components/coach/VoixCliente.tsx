import { Marque } from "@/components/coach/base";

// La voix de la cliente, côté équipe : partout le même traitement (bloc beige, filet rose à gauche,
// « Déborah a écrit » et la date en tête, texte droit). Jamais confondue avec Cloé ni Émilien.
export function VoixCliente({ prenom, date, texte, aAborder = false, compact = false, nouveau = false }: { prenom: string; date: string | null; texte: string; aAborder?: boolean; compact?: boolean; nouveau?: boolean }) {
  return (
    <div className="voix-cliente flex flex-col gap-1.5 rounded-r-[6px] border-l-[3px] border-rose bg-beige px-4 pb-4 pt-3.5">
      <p className="m-0 flex flex-wrap items-baseline gap-x-1.5 font-titre text-[14px] font-semibold text-violet">
        <span>{prenom} a écrit</span>
        {date ? <span className="font-sans font-normal opacity-85">· {date}</span> : null}
        {nouveau ? <Marque className="self-center">nouveau</Marque> : null}
        {aAborder ? <Marque className="self-center">à aborder</Marque> : null}
      </p>
      <p className={`m-0 whitespace-pre-line text-encre [overflow-wrap:anywhere] ${compact ? "line-clamp-5 text-[14px] leading-[1.55]" : "text-[16px] leading-[1.6]"}`}>{texte}</p>
    </div>
  );
}
