import Link from "next/link";

// Logo texte : « blocages » en League Spartan violet, « & INTUITION » en rouge.
// La police Chloe (fichier) sera ajoutée quand Cloé fournira le fichier de police.
export function Logo({ href = "/", taille = "md" }: { href?: string; taille?: "sm" | "md" }) {
  const base = taille === "sm" ? "text-xl" : "text-3xl";
  const sous = taille === "sm" ? "text-[0.6rem]" : "text-xs";
  return (
    <Link href={href} className="inline-flex flex-col leading-none" aria-label="Blocages & Intuition">
      <span className={`titre font-bold lowercase tracking-tight text-violet ${base}`}>blocages</span>
      <span className={`titre font-bold uppercase tracking-[0.18em] text-rouge ${sous}`}>&amp; intuition</span>
    </Link>
  );
}
