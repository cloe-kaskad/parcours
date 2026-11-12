import { Marque } from "@/components/coach/base";

// La voix de la cliente, côté équipe : partout le même traitement (bloc beige, filet rose à gauche,
// « Déborah a écrit » et la date en tête, texte droit). Jamais confondue avec Cloé ni Émilien.
export function VoixCliente({ prenom, date, texte, aAborder = false, compact = false, nouveau = false }: { prenom: string; date: string | null; texte: string; aAborder?: boolean; compact?: boolean; nouveau?: boolean }) {
  return (
    <div className="voix-cliente flex flex-col gap-1.5 rounded-[4px] border-l-4 border-rose bg-beige px-4 py-3">
      <p className="m-0 flex flex-wrap items-baseline gap-x-2 font-titre text-[13px] font-semibold text-violet">
        <span>{prenom} a écrit</span>
        {date ? <span className="font-italique text-[12px] font-normal italic">{date}</span> : null}
        {nouveau ? <Marque className="self-center">nouveau</Marque> : null}
        {aAborder ? <span className="ml-auto text-[11px] text-rouge">● à aborder</span> : null}
      </p>
      <p className={`m-0 whitespace-pre-line text-encre [overflow-wrap:anywhere] ${compact ? "line-clamp-5 text-[14px] leading-[1.55]" : "text-[16px] leading-[1.6]"}`}>{texte}</p>
    </div>
  );
}
