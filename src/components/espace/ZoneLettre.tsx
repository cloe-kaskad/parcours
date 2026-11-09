import Link from "next/link";
import { Papier } from "./Papier";

export function ZoneLettre({
  titre,
  date,
  debut,
  exercices,
  lien,
  actions,
}: {
  titre: string;
  date: string | null;
  debut: string;
  exercices: { id: string; titre: string; ecrit: boolean }[];
  lien: string;
  actions?: React.ReactNode;
}) {
  return (
    <Papier className="flex flex-col gap-3.5 px-6 pb-[26px] pt-[30px] md:gap-4 md:px-11 md:pb-9 md:pt-10">
      <h2 className="t-lettre text-violet">{titre}</h2>
      {date ? <p className="font-italique text-[14px] italic text-violet">envoyée le {date}</p> : null}
      {debut ? <p className="t-lecture max-w-[560px] pt-1">{debut}</p> : null}
      {exercices.length ? (
        <ul className="flex flex-col border-t border-[var(--filet-papier-fort)] pt-2">
          {exercices.map((e, i) => (
            <li key={e.id} className={`flex items-baseline justify-between gap-3 py-[13px] md:py-3.5 ${i < exercices.length - 1 ? "border-b border-[var(--filet-papier)]" : ""}`}>
              <span className="t-carte md:text-[21px]!">{e.titre}</span>
              {e.ecrit ? <span className="shrink-0 font-italique text-[12px] italic text-violet">tu as écrit</span> : null}
            </li>
          ))}
        </ul>
      ) : null}
      <div className="flex flex-wrap items-baseline gap-[18px] pt-1.5">
        <Link href={lien} className="t-action inline-block text-[18px] text-rouge md:text-[19px]">
          Lire la lettre →
        </Link>
        {actions}
      </div>
    </Papier>
  );
}
