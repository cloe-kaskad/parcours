import { jourEtHeure } from "@/lib/dates";
import { Calendrier } from "./Calendrier";

export function ProchaineSeance({ date, point }: { date: string | null; point: string | null }) {
  if (!date) {
    return <p className="font-italique text-[14px] italic text-creme/70">Pas encore de date. Cloé te la proposera bientôt.</p>;
  }
  return (
    <div className="flex items-center gap-4 md:gap-5">
      <Calendrier date={date} prochaine />
      <div className="flex flex-col gap-1">
        <p className="text-[12px] tracking-[0.02em] text-rose md:text-[13px]">Prochaine séance</p>
        <p className="t-seance text-creme md:text-[30px]!">{jourEtHeure(date)}</p>
        {point ? <p className="font-italique text-[13px] italic text-creme/70 md:text-[14px]">{point}</p> : null}
      </div>
    </div>
  );
}
