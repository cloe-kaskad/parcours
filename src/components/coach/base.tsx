import Link from "next/link";
import { Deconnexion } from "@/components/Deconnexion";
import { Calendrier } from "@/components/espace/Calendrier";
import type { Point } from "@/lib/agenda";

// La page de travail : papier dominant.
export function PageCoach({ children }: { children: React.ReactNode }) {
  return <div className="papier papier-page flex flex-1 flex-col text-encre">{children}</div>;
}

// Le bandeau violet, avec un retour clair.
export function Barre({ retour, droite }: { retour: { href: string; libelle: string }; droite?: React.ReactNode }) {
  return (
    <div className="flex min-h-[52px] items-center justify-between gap-4 bg-violet px-[22px] py-1.5 text-creme md:px-10">
      <Link href={retour.href} className="t-action inline-flex min-h-[44px] items-center text-[14px] text-creme">
        ← {retour.libelle}
      </Link>
      <div className="flex items-center gap-4">
        {droite}
        <Deconnexion className="text-creme/70" />
      </div>
    </div>
  );
}

export function LienRose({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="t-action inline-flex min-h-[44px] items-center text-[14px] text-rose">
      {children}
    </Link>
  );
}

export function Colonne({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto flex w-full max-w-3xl flex-col px-[22px] ${className}`}>{children}</div>;
}

// Les trois points d'une séance : transcript, Émilien, exercices.
export function Points({ points }: { points: [Point, Point, Point] }) {
  const noms = ["transcript", "Émilien", "exercices"];
  const mots: Record<Point, string> = { plein: "fait", vide: "à venir", retard: "en retard" };
  return (
    <div className="flex shrink-0 items-center gap-1.5" role="img" aria-label={points.map((p, i) => `${noms[i]} ${mots[p]}`).join(", ")}>
      {points.map((p, i) => (
        <span key={i} className={`point point-${p}`} />
      ))}
    </div>
  );
}

export function LigneSeance({
  href,
  date,
  retardee = false,
  prenom,
  numero,
  libelle,
  droite,
  estompee = false,
}: {
  href: string;
  date: string | null;
  retardee?: boolean;
  prenom: string;
  numero: number;
  libelle: string;
  droite: React.ReactNode;
  estompee?: boolean;
}) {
  return (
    <Link href={href} className={`flex items-center gap-3.5 border-t border-[var(--filet-papier)] py-4 ${estompee ? "opacity-55" : ""}`}>
      {date ? <Calendrier date={date} surPapier retard={retardee} /> : null}
      <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
        <span className="font-titre text-[20px] font-semibold leading-none">
          {prenom} <span className="font-normal opacity-60">· séance {numero}</span>
        </span>
        <span className={`text-[11px] ${retardee ? "font-medium text-rouge" : "text-violet/80"}`}>{libelle}</span>
      </div>
      {droite}
    </Link>
  );
}

// Le bandeau d'outils discret au-dessus d'une zone.
export function Outils({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`papier outils ${className}`}>{children}</div>;
}

export function NoteOutil({ children }: { children: React.ReactNode }) {
  return <span className="font-italique text-[12px] italic text-violet/80">{children}</span>;
}

export function TitreSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <h2 className={`font-titre text-[22px] font-semibold tracking-[-0.02em] ${className}`}>{children}</h2>;
}
