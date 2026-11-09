import { jourCalendrier, moisCalendrier } from "@/lib/dates";

// Le petit calendrier des séances. Le grand, en rouge, annonce la prochaine.
export function Calendrier({ date, prochaine = false }: { date: string; prochaine?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={`shrink-0 overflow-hidden rounded-[var(--rayon-calendrier)] border border-[var(--filet-calendrier)] text-center font-titre font-semibold ${prochaine ? "w-[52px] md:w-16" : "w-11"}`}
    >
      <div className={`text-[10px] uppercase tracking-[0.08em] ${prochaine ? "bg-rouge pb-[3px] pt-[5px] text-creme" : "bg-rose pb-0.5 pt-1 text-violet-nuit"}`}>{moisCalendrier(date)}</div>
      <div className={`leading-none text-creme ${prochaine ? "pb-1 pt-[7px] text-[26px] md:text-[32px]" : "pb-[3px] pt-[5px] text-[20px]"}`}>{jourCalendrier(date)}</div>
    </div>
  );
}
