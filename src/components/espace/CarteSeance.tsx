import Link from "next/link";
import { jourEtMois } from "@/lib/dates";
import { Calendrier } from "./Calendrier";

export function CarteSeance({ numero, date, mots, lien }: { numero: number; date: string | null; mots: string[]; lien: string | null }) {
  return (
    <div className="flex flex-col gap-1.5 border-t border-[var(--filet-violet)] py-[18px]">
      <div className="flex items-center gap-3.5">
        {date ? <Calendrier date={date} /> : null}
        <div className="flex flex-col gap-0.5">
          <h3 className="t-seance text-creme">Séance {numero}</h3>
          {date ? <p className="font-italique text-[13px] italic text-creme/70">{jourEtMois(date)}</p> : null}
        </div>
      </div>
      {mots.length ? <p className="font-titre text-[15px] font-medium text-rose">{mots.join(" · ")}</p> : null}
      {lien ? (
        <Link href={lien} className="t-action self-start pt-1 text-[14px] text-rouge">
          Lire la séance →
        </Link>
      ) : null}
    </div>
  );
}
