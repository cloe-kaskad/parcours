import { Marque } from "@/components/coach/base";

// La voix de la cliente, côté équipe : partout le même traitement (bloc beige, filet rose à gauche,
// « Déborah a écrit » et la date en tête, texte droit). Jamais confondue avec Cloé ni Émilien.
export function VoixCliente({ prenom, date, texte, aAborder = false, compact = false, nouveau = false, audio = null }: { prenom: string; date: string | null; texte: string; aAborder?: boolean; compact?: boolean; nouveau?: boolean; audio?: string | null }) {
  return (
    <div className="voix-cliente flex flex-col gap-1.5 carte-blanche rounded-l-none border-l-[3px] border-l-rose px-4 pb-4 pt-3.5">
      <p className="m-0 flex flex-wrap items-baseline gap-x-1.5 font-titre text-[14px] font-semibold text-violet">
        <span>{prenom} {audio ? "a dit" : "a écrit"}</span>
        {date ? <span className="font-sans font-normal opacity-85">· {date}</span> : null}
        {nouveau ? <Marque className="self-center">nouveau</Marque> : null}
        {aAborder ? <Marque className="self-center">à aborder</Marque> : null}
      </p>
      {audio ? <audio controls preload="none" src={audio} className="h-11 w-full" /> : null}
      <p className={`m-0 whitespace-pre-line text-encre [overflow-wrap:anywhere] ${compact ? "line-clamp-5 text-[14px] leading-[1.55]" : "text-[16px] leading-[1.6]"}`}>{texte}</p>
    </div>
  );
}
