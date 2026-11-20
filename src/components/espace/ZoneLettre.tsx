import Link from "next/link";
import { Papier } from "./Papier";

// La zone « Mes pratiques » du tableau de bord (maquette A-dashboard, 19 novembre 2026) :
// le titre, la date d'envoi et le nombre d'exercices, la liste numérotée, un seul geste.
export function ZoneLettre({
  titre,
  date,
  exercices,
  lien,
  actions,
}: {
  titre: string;
  date: string | null;
  exercices: { id: string; titre: string; ecrit: boolean; bonus: boolean }[];
  lien: string;
  actions?: React.ReactNode;
}) {
  const nombre = exercices.filter((e) => !e.bonus).length;
  const bonus = exercices.length - nombre;
  const compte = [nombre ? `${nombre} exercice${nombre > 1 ? "s" : ""}` : null, bonus ? (bonus > 1 ? `${bonus} bonus` : "un bonus") : null].filter(Boolean).join(" et ");
  const ligne = [date ? `envoyées le ${date}` : null, compte || null].filter(Boolean).join(" · ");
  let rang = 0;
  return (
    <Papier className="flex flex-col gap-3.5 px-6 pb-[26px] pt-[30px] md:gap-4 md:px-11 md:pb-9 md:pt-10">
      <h2 className="font-titre text-[32px] font-semibold leading-none tracking-[-0.02em] text-violet md:text-[40px]">{titre}</h2>
      {ligne ? <p className="text-[14px] text-violet">{ligne}</p> : null}
      {exercices.length ? (
        <ul className="flex flex-col border-t border-[var(--filet-papier-fort)] pt-2">
          {exercices.map((e, i) => (
            <li key={e.id} className={`flex items-baseline justify-between gap-3 py-[13px] md:py-3.5 ${i < exercices.length - 1 ? "border-b border-[var(--filet-papier)]" : ""}`}>
              <span className="font-titre text-[19px] font-semibold leading-[1.15] text-encre md:text-[21px]">
                {e.bonus ? "+ " : `${++rang}. `}
                {e.titre}
              </span>
              {e.ecrit ? <span className="shrink-0 text-[14px] text-violet">tu as écrit</span> : null}
            </li>
          ))}
        </ul>
      ) : null}
      <div className="flex flex-wrap items-center gap-[18px] pt-1.5">
        <Link href={lien} className="bouton-rouge inline-flex items-center">
          Ouvrir mes pratiques
        </Link>
        {actions}
      </div>
    </Papier>
  );
}
