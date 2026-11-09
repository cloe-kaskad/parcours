import { jourCalendrier, moisCalendrier } from "@/lib/dates";

// Le petit calendrier des séances. Le grand, en rouge, annonce la prochaine.
export function Calendrier({ date, prochaine = false, surPapier = false }: { date: string; prochaine?: boolean; surPapier?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={`shrink-0 overflow-hidden rounded-[var(--rayon-calendrier)] border text-center ${surPapier ? "border-violet/30" : "border-[var(--filet-calendrier)]"} font-titre font-semibold ${prochaine ? "w-[52px] md:w-16" : "w-11"}`}
    >
      <div className={`text-[10px] uppercase tracking-[0.08em] ${surPapier ? "bg-violet pb-[3px] pt-[5px] text-creme" : prochaine ? "bg-rouge pb-[3px] pt-[5px] text-creme" : "bg-rose pb-0.5 pt-1 text-violet-nuit"}`}>{moisCalendrier(date)}</div>
      <div className={`leading-none ${surPapier ? "text-encre" : "text-creme"} ${prochaine ? "pb-1 pt-[7px] text-[26px] md:text-[32px]" : "pb-[3px] pt-[5px] text-[20px]"}`}>{jourCalendrier(date)}</div>
    </div>
  );
}
