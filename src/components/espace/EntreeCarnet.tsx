import { avantOuverture, jourEtMois } from "@/lib/dates";
import { MarqueurAborder } from "./MarqueurAborder";
import { Papier } from "./Papier";

function IconeCarnet() {
  return (
    <svg aria-hidden="true" width="26" height="30" viewBox="0 0 26 30" className="mt-0.5 shrink-0" fill="none" stroke="#59114D" strokeLinecap="round">
      <rect x="4" y="2" width="19" height="26" rx="2.5" strokeWidth="1.5" />
      <path d="M4 9H2M4 15H2M4 21H2" strokeWidth="1.5" />
      <path d="M9 11h9M9 16h9M9 21h5" strokeWidth="1.2" opacity=".6" />
    </svg>
  );
}

export function EntreeCarnet({
  id,
  date,
  contenu,
  aAborder,
  exercice,
  decalee = false,
  coupee = false,
}: {
  id: string;
  date: string;
  contenu: string;
  aAborder: boolean;
  exercice: string | null;
  decalee?: boolean;
  coupee?: boolean;
}) {
  return (
    <Papier className={`flex items-start gap-3.5 p-[18px] ${decalee ? "ml-7 md:ml-8" : ""}`}>
      <IconeCarnet />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-3">
          {/* Une date d'avant l'ouverture vient de la migration : elle n'est pas réelle. */}
          {avantOuverture(date) ? null : <span className="font-italique text-[15px] italic text-violet">{jourEtMois(date)}</span>}
          <MarqueurAborder id={id} marque={aAborder} />
        </div>
        <p className={`whitespace-pre-line text-[15px] leading-[1.55] ${coupee ? "line-clamp-6" : ""}`}>{contenu}</p>
        {exercice ? <p className="text-[12px] text-violet/70">sous « {exercice} »</p> : null}
      </div>
    </Papier>
  );
}
